import { NextResponse, type NextRequest } from "next/server";

import { reportIncident } from "@/lib/alerting";
import { sendNoMatchClientEmail } from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";

// Plafond par exécution : le surplus est traité le lendemain.
const BATCH_LIMIT = 100;

type NoMatchCandidate = {
  id: string;
  clientFirstName: string;
  clientEmail: string;
  city: string;
};

/**
 * Cron Vercel quotidien (9h UTC, vercel.json), protégé par
 * `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Prévient le client dont la demande n'a trouvé aucun acheteur 24 h après le
 * début du matching. Un seul email par lead (Lead.noMatchNotifiedAt) : il
 * informe que la recherche continue, sans promettre de relance ultérieure.
 * Le marquage n'est posé que si l'envoi est confirmé ; un envoi échoué est
 * retenté le lendemain. Limite connue : si le marquage échoue après l'envoi,
 * l'email part une seconde fois.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken) {
    console.error("[cron/check-no-match-leads] CRON_SECRET env non configuré");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = {
    candidates: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  let candidates: NoMatchCandidate[] = [];
  try {
    candidates = await prisma.$queryRaw<NoMatchCandidate[]>`
      SELECT
        l."id"              AS "id",
        l."clientFirstName" AS "clientFirstName",
        l."clientEmail"     AS "clientEmail",
        l."city"            AS "city"
      FROM "Lead" l
      WHERE l."status" IN ('PENDING_MATCH', 'ASSIGNED')
        AND l."matchingStartedAt" IS NOT NULL
        AND l."matchingStartedAt" < NOW() - INTERVAL '24 hours'
        AND l."noMatchNotifiedAt" IS NULL
        AND l."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "LeadAssignment" la
          WHERE la."leadId" = l."id" AND la."status" = 'ACCEPTED'
        )
      ORDER BY l."matchingStartedAt" ASC
      LIMIT ${BATCH_LIMIT}
    `;
    stats.candidates = candidates.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/check-no-match-leads] query failed", msg);
    stats.errors.push(`query: ${msg}`);
  }

  // deliver() ne lève jamais : seul le booléen renvoyé par le sender signale
  // un échec d'envoi, qui laisse le lead candidat pour le lendemain.
  for (const lead of candidates) {
    try {
      const sent = await sendNoMatchClientEmail({
        to: lead.clientEmail,
        firstName: lead.clientFirstName,
        city: lead.city,
      });
      if (!sent) {
        stats.errors.push(`lead ${lead.id}: envoi email echoue`);
        continue;
      }
      await prisma.lead.update({
        where: { id: lead.id },
        data: { noMatchNotifiedAt: new Date() },
      });
      stats.emailsSent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[cron/check-no-match-leads] lead failed", {
        leadId: lead.id,
        error: msg,
      });
      stats.errors.push(`lead ${lead.id}: ${msg}`);
    }
  }

  // Un seul incident récapitulatif : un par lead noierait le canal. Pas de
  // heartbeat ici, celui de process-leads (toutes les 15 min) suffit.
  if (stats.errors.length > 0) {
    await reportIncident("cron.check-no-match-leads", {
      context: { failed: stats.errors.length, first: stats.errors[0] },
    });
  }

  return NextResponse.json({ ok: true, ...stats });
}
