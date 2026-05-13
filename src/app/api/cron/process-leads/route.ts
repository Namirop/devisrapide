import { NextResponse, type NextRequest } from "next/server";

import { getAppConfig } from "@/lib/config";
import { assignLeadToPros } from "@/lib/matching/assign";
import { findMatchingPros } from "@/lib/matching/find-pros";
import { prisma } from "@/lib/prisma";

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

  const stats = {
    expandedToPalier1: 0,
    expandedToPalier2: 0,
    timedOut: 0,
    newAssignments: 0,
  };

  // ── 1. Expansion palier 1 (60km) ─────────────────────────────
  const toExpand1 = await prisma.lead.findMany({
    where: {
      status: "PENDING_MATCH",
      matchingStartedAt: { lte: thresholdPalier1 },
      currentRadiusKm: { lt: palier1, gte: 0 },
    },
    select: { id: true },
  });
  for (const lead of toExpand1) {
    const existing = await prisma.leadAssignment.findMany({
      where: { leadId: lead.id },
      select: { proProfileId: true },
    });
    const excludeProIds = existing.map((a) => a.proProfileId);
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
  for (const lead of toExpand2) {
    const existing = await prisma.leadAssignment.findMany({
      where: { leadId: lead.id },
      select: { proProfileId: true },
    });
    const excludeProIds = existing.map((a) => a.proProfileId);
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
  }

  return NextResponse.json({ ok: true, stats, at: now.toISOString() });
}
