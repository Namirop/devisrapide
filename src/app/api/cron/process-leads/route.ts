import { NextResponse, type NextRequest } from "next/server";

import { afterResponse } from "@/lib/after-response";
import { pingCronHeartbeat, reportIncident } from "@/lib/alerting";
import { getAppConfig } from "@/lib/config";
import { assignLeadToPros } from "@/lib/matching/assign";
import { findMatchingPros } from "@/lib/matching/find-pros";
import { prisma } from "@/lib/prisma";
import { sendPushToProfile } from "@/lib/push/send";

// Fenêtre du push « bientôt expiré » : le cron tournant toutes les 15 min,
// 30 min garantissent au moins un passage avant l'expiration effective.
const EXPIRY_NOTIFICATION_THRESHOLD_MIN = 30;

/**
 * Cron Vercel toutes les 15 min (vercel.json), protégé par
 * `Authorization: Bearer ${CRON_SECRET}`. Dans l'ordre :
 * 1-2. élargissement au palier 1 puis 2 (OPEN = -1) des leads PENDING_MATCH
 *      dont le délai `ZONE_EXPANSION_DELAYS_MIN` est écoulé ;
 * 3.   timeout global des leads et de leurs assignments PENDING ;
 * 3b.  expiration individuelle des assignments (filet de sécurité) ;
 * 4.   push « bientôt expiré » aux pros.
 *
 * Idempotent : un run manqué est rattrapé au suivant.
 */
export async function GET(request: NextRequest) {
  // ── Auth CRON_SECRET ─────────────────────────────────────────
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

  // ── Configuration ────────────────────────────────────────────
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
  const palier1 = Number(paliers[1]);
  const palier2 = Number(paliers[2]); // -1 = OPEN
  const delay1Min = Number(delays[0]);
  const delay2Min = Number(delays[1]);

  const now = new Date();
  const thresholdPalier1 = new Date(now.getTime() - delay1Min * 60 * 1000);
  const thresholdPalier2 = new Date(now.getTime() - delay2Min * 60 * 1000);

  // Chaque lead a son propre try/catch : un lead incohérent n'interrompt pas
  // le run, son erreur est consignée dans stats.errors.
  const stats = {
    expandedToPalier1: 0,
    expandedToPalier2: 0,
    timedOut: 0,
    assignmentsExpiredIndividually: 0,
    newAssignments: 0,
    expiryNotificationsSent: 0,
    errors: [] as Array<{
      leadId: string;
      step:
        | "palier1"
        | "palier2"
        | "timeout"
        | "assignment-expiry"
        | "expiry-notif";
      message: string;
    }>,
  };

  function logLeadError(
    leadId: string,
    step:
      "palier1" | "palier2" | "timeout" | "assignment-expiry" | "expiry-notif",
    err: unknown,
  ): void {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/process-leads] lead processing failed", {
      leadId,
      step,
      error: message,
    });
    stats.errors.push({ leadId, step, message });
    // Pas d'incident par lead (30 échecs = 30 pings) : bilan unique en fin
    // de run.
  }

  // Pros déjà assignés, chargés en une requête pour tout le palier.
  // Limite connue : recherche et assignation restent séquentielles, lead
  // par lead.
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

  // ── 1. Élargissement au palier 1 ─────────────────────────────
  const toExpand1 = await prisma.lead.findMany({
    where: {
      deletedAt: null,
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

  // ── 2. Élargissement au palier 2 (OPEN) ──────────────────────
  const toExpand2 = await prisma.lead.findMany({
    where: {
      deletedAt: null,
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
          radiusKm: palier2, // -1 (OPEN), conservé sur l'assignment
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
  // ASSIGNED n'est écrit que par les données de démo, mais un lead dans cet
  // état doit lui aussi expirer.
  const toExpire = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      status: { in: ["PENDING_MATCH", "ASSIGNED"] },
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

  // ── 3b. Expiration individuelle des assignments PENDING ──────
  // Filet de sécurité : un assignment expire normalement avec son lead. Ce
  // scan couvre les leads sans expiresAt et toute échéance plus courte.
  const toExpireAssignments = await prisma.leadAssignment.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
      lead: { deletedAt: null },
    },
    select: { id: true, leadId: true },
  });
  if (toExpireAssignments.length > 0) {
    try {
      await prisma.leadAssignment.updateMany({
        where: { id: { in: toExpireAssignments.map((a) => a.id) } },
        data: { status: "EXPIRED" },
      });
      stats.assignmentsExpiredIndividually = toExpireAssignments.length;
    } catch (err) {
      for (const a of toExpireAssignments) {
        logLeadError(a.leadId, "assignment-expiry", err);
      }
    }
  }

  // ── 4. Push « lead bientôt expiré » ───────────────────────
  // expiryNotifiedAt est posé avant l'envoi : un seul rappel par assignment.
  const expirySoonThreshold = new Date(
    now.getTime() + EXPIRY_NOTIFICATION_THRESHOLD_MIN * 60 * 1000,
  );
  const expiringSoon = await prisma.leadAssignment.findMany({
    where: {
      status: "PENDING",
      expiresAt: { gt: now, lte: expirySoonThreshold },
      expiryNotifiedAt: null,
      lead: { deletedAt: null },
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
      afterResponse("push/expirySoon", () =>
        sendPushToProfile(a.proProfileId, {
          title: "Lead bientôt expiré",
          body: `Un lead ${a.lead.subCategory.category.name} à ${a.lead.city} expire bientôt. Acceptez-le avant qu'il ne parte.`,
          url: `/dashboard/leads/${a.id}`,
          tag: `expiry-soon-${a.id}`,
        }),
      );
      stats.expiryNotificationsSent++;
    } catch (err) {
      logLeadError(a.lead.id, "expiry-notif", err);
    }
  }

  // ── Fin de run ───────────────────────────────────────────────
  // Heartbeat uniquement si le run est propre : pinguer après un incident
  // refermerait aussitôt l'alerte qu'on vient d'ouvrir.
  if (stats.errors.length > 0) {
    const first = stats.errors[0];
    await reportIncident("cron.process-leads", {
      context: {
        failedLeads: stats.errors.length,
        firstLeadId: first.leadId,
        firstStep: first.step,
        firstMessage: first.message,
      },
    });
  } else {
    await pingCronHeartbeat();
  }

  return NextResponse.json({ ok: true, stats, at: now.toISOString() });
}
