import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";

import { getAppConfig } from "@/lib/config";
import { assignLeadToPros } from "@/lib/matching/assign";
import { findMatchingPros } from "@/lib/matching/find-pros";
import { prisma } from "@/lib/prisma";
import { sendPushToProfile } from "@/lib/push/send";

// Sprint 5.5 : seuil au dela duquel un assignment PENDING est considere
// "bientot expire" pour le push de rappel. Le cron tournant tous les 15
// min (Hobby plan : disabled), un seuil de 30 min garantit min 1 passage
// entre la notification et l'expiration effective.
const EXPIRY_NOTIFICATION_THRESHOLD_MIN = 30;

/**
 * Cron Vercel — /api/cron/process-leads
 *
 * Schedule : disabled en Hobby plan (Vercel limite a 1 cron/jour). La cron
 *            entry "*\/15 * * * *" doit etre re-ajoutee dans vercel.json
 *            apres l'upgrade Pro (cf. docs/v2-roadmap.md).
 *            En attendant : la route reste curlable manuellement avec le
 *            header Bearer pour tester ou pour declenchement ponctuel.
 * Auth     : header `Authorization: Bearer ${CRON_SECRET}`.
 *
 * 3 scans BDD, dans cet ordre :
 *
 * 1. **Expansion palier 1 (30km -> 60km)** : leads PENDING_MATCH dont
 *    `matchingStartedAt + ZONE_EXPANSION_DELAYS_MIN[0]` est passe et
 *    qui sont encore au palier initial (currentRadiusKm < paliers[1]).
 *    On trouve les nouveaux pros du palier 1 (en excluant ceux deja
 *    assignes), on cree leurs assignments, et on bumpe currentRadiusKm.
 *
 * 2. **Expansion palier 2 (60km -> OPEN)** : meme logique, declenchee
 *    apres ZONE_EXPANSION_DELAYS_MIN[1]. OPEN est represente par le
 *    sentinel -1.
 *
 * 3. **Timeout global** : leads PENDING_MATCH dont `expiresAt` est
 *    passe → status EXPIRED + tous les PENDING assignments → EXPIRED.
 *    Pas d'email particulier au client (cf. Sprint 2b a discuter pour
 *    un email "personne n'a accepte").
 *
 * Le handler est idempotent : si rien ne matche les conditions, il
 * repond OK avec stats=0. Si un run est manque (cron Vercel down 1h),
 * les leads concernes seront ramasses au run suivant. Latence cron ~15min
 * acceptee (MVP, pas de SLA temps reel).
 */
export async function GET(request: NextRequest) {
  // ── Auth via CRON_SECRET (pattern Vercel Cron) ───────────────
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken) {
    console.error("[cron/process-leads] CRON_SECRET env non configuré");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Lecture config ───────────────────────────────────────────
  const paliers = await getAppConfig("RADIUS_PALIERS_KM", "json");
  const delays = await getAppConfig("ZONE_EXPANSION_DELAYS_MIN", "json");
  if (
    !Array.isArray(paliers) ||
    paliers.length < 3 ||
    !Array.isArray(delays) ||
    delays.length < 2
  ) {
    console.error("[cron/process-leads] config paliers/delays invalide");
    return NextResponse.json({ error: "Invalid config" }, { status: 500 });
  }
  const palier1 = Number(paliers[1]); // 60
  const palier2 = Number(paliers[2]); // -1 = OPEN
  const delay1Min = Number(delays[0]); // 120
  const delay2Min = Number(delays[1]); // 240

  const now = new Date();
  const thresholdPalier1 = new Date(now.getTime() - delay1Min * 60 * 1000);
  const thresholdPalier2 = new Date(now.getTime() - delay2Min * 60 * 1000);

  // Stats run : agregation des operations + errors par lead.
  // Sprint 5b : chaque lead est isole dans son propre try/catch — un
  // lead corrompu (lat/lng null, donnee inconsistante, etc.) n'arrete
  // plus le run global. errors[] capture leadId + palier + message.
  const stats = {
    expandedToPalier1: 0,
    expandedToPalier2: 0,
    timedOut: 0,
    newAssignments: 0,
    expiryNotificationsSent: 0,
    errors: [] as Array<{
      leadId: string;
      step: "palier1" | "palier2" | "timeout" | "expiry-notif";
      message: string;
    }>,
  };

  function logLeadError(
    leadId: string,
    step: "palier1" | "palier2" | "timeout" | "expiry-notif",
    err: unknown,
  ): void {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/process-leads] lead processing failed", {
      leadId,
      step,
      error: message,
    });
    stats.errors.push({ leadId, step, message });
    Sentry.captureException(err, {
      tags: { area: "cron", step },
      extra: { leadId },
    });
  }

  // Helper batch : prefetch en 1 query les pros deja assignes pour un
  // ensemble de leads, retourne Map<leadId, proProfileId[]>. Elimine
  // N requetes (1 par lead avant Sprint 5b) -> 1 requete pour le palier.
  //
  // Note : findMatchingPros + assignLeadToPros restent per-lead (raw SQL
  // Haversine + INSERT multi-row). V2 = job worker (Inngest) avec batch
  // ou paralelisation par segments.
  async function prefetchExistingProsByLead(
    leadIds: string[],
  ): Promise<Map<string, string[]>> {
    if (leadIds.length === 0) return new Map();
    const rows = await prisma.leadAssignment.findMany({
      where: { leadId: { in: leadIds } },
      select: { leadId: true, proProfileId: true },
    });
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const list = map.get(r.leadId);
      if (list) {
        list.push(r.proProfileId);
      } else {
        map.set(r.leadId, [r.proProfileId]);
      }
    }
    return map;
  }

  // ── 1. Expansion palier 1 (60km) ─────────────────────────────
  const toExpand1 = await prisma.lead.findMany({
    where: {
      status: "PENDING_MATCH",
      matchingStartedAt: { lte: thresholdPalier1 },
      currentRadiusKm: { lt: palier1, gte: 0 },
    },
    select: { id: true },
  });
  const existingByLead1 = await prefetchExistingProsByLead(
    toExpand1.map((l) => l.id),
  );
  for (const lead of toExpand1) {
    try {
      const excludeProIds = existingByLead1.get(lead.id) ?? [];
      const pros = await findMatchingPros({
        leadId: lead.id,
        radiusKm: palier1,
        excludeProIds,
      });
      if (pros.length > 0) {
        const created = await assignLeadToPros({
          leadId: lead.id,
          pros,
          radiusKm: palier1,
        });
        stats.newAssignments += created;
      }
      await prisma.lead.update({
        where: { id: lead.id },
        data: { currentRadiusKm: palier1 },
      });
      stats.expandedToPalier1++;
    } catch (err) {
      logLeadError(lead.id, "palier1", err);
    }
  }

  // ── 2. Expansion palier 2 (OPEN) ─────────────────────────────
  const toExpand2 = await prisma.lead.findMany({
    where: {
      status: "PENDING_MATCH",
      matchingStartedAt: { lte: thresholdPalier2 },
      currentRadiusKm: { gte: 0 }, // pas encore OPEN (-1)
    },
    select: { id: true },
  });
  const existingByLead2 = await prefetchExistingProsByLead(
    toExpand2.map((l) => l.id),
  );
  for (const lead of toExpand2) {
    try {
      const excludeProIds = existingByLead2.get(lead.id) ?? [];
      const pros = await findMatchingPros({
        leadId: lead.id,
        radiusKm: null, // OPEN
        excludeProIds,
      });
      if (pros.length > 0) {
        const created = await assignLeadToPros({
          leadId: lead.id,
          pros,
          radiusKm: palier2, // -1 sentinel, persiste sur l'assignment
        });
        stats.newAssignments += created;
      }
      await prisma.lead.update({
        where: { id: lead.id },
        data: { currentRadiusKm: palier2 },
      });
      stats.expandedToPalier2++;
    } catch (err) {
      logLeadError(lead.id, "palier2", err);
    }
  }

  // ── 3. Timeout global ────────────────────────────────────────
  // expiresAt est pose a la creation du lead = now + LEAD_GLOBAL_TIMEOUT_HOURS.
  const toExpire = await prisma.lead.findMany({
    where: {
      status: "PENDING_MATCH",
      expiresAt: { lte: now },
    },
    select: { id: true },
  });
  for (const lead of toExpire) {
    try {
      await prisma.$transaction([
        prisma.leadAssignment.updateMany({
          where: { leadId: lead.id, status: "PENDING" },
          data: { status: "EXPIRED" },
        }),
        prisma.lead.update({
          where: { id: lead.id },
          data: { status: "EXPIRED" },
        }),
      ]);
      stats.timedOut++;
    } catch (err) {
      logLeadError(lead.id, "timeout", err);
    }
  }

  // ── 4. Notifications "lead bientot expire" ────────────────
  //    Pour chaque LeadAssignment PENDING dont expiresAt approche
  //    (<= EXPIRY_NOTIFICATION_THRESHOLD_MIN) et qui n'a pas encore ete
  //    notifie (expiryNotifiedAt IS NULL), on envoie un push au pro et
  //    on set expiryNotifiedAt pour eviter le spam aux runs suivants.
  const expirySoonThreshold = new Date(
    now.getTime() + EXPIRY_NOTIFICATION_THRESHOLD_MIN * 60 * 1000,
  );
  const expiringSoon = await prisma.leadAssignment.findMany({
    where: {
      status: "PENDING",
      expiresAt: { gt: now, lte: expirySoonThreshold },
      expiryNotifiedAt: null,
    },
    select: {
      id: true,
      proProfileId: true,
      lead: {
        select: {
          id: true,
          city: true,
          subCategory: {
            select: { category: { select: { name: true } } },
          },
        },
      },
    },
  });
  for (const a of expiringSoon) {
    try {
      await prisma.leadAssignment.update({
        where: { id: a.id },
        data: { expiryNotifiedAt: new Date() },
      });
      void sendPushToProfile(a.proProfileId, {
        title: "Lead bientôt expiré",
        body: `Un lead ${a.lead.subCategory.category.name} à ${a.lead.city} expire bientôt. Acceptez-le avant qu'il ne parte.`,
        url: "/dashboard/leads",
        tag: `expiry-soon-${a.id}`,
      }).catch(() => {});
      stats.expiryNotificationsSent++;
    } catch (err) {
      logLeadError(a.lead.id, "expiry-notif", err);
    }
  }

  return NextResponse.json({ ok: true, stats, at: now.toISOString() });
}
