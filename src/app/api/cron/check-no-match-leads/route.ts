import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

// Batch max par run pour eviter qu'un cron explose si la BDD a beaucoup
// de leads en attente (volume V1 BE : largement suffisant). Au-dela,
// les leads suivants seront ramasses au run du lendemain.
const BATCH_LIMIT = 100;

type NoMatchCandidate = {
  id: string;
  clientFirstName: string;
  clientEmail: string;
  city: string;
};

/**
 * Cron Vercel — /api/cron/check-no-match-leads
 *
 * Schedule : daily a 9h00 (entry dans vercel.json).
 * Auth     : header `Authorization: Bearer ${CRON_SECRET}` (meme pattern
 *            que /api/cron/process-leads).
 *
 * Trouve les leads pour lesquels aucun pro n'a accepte sous 24h+ et qui
 * n'ont pas encore recu l'email de suivi "no-match" (Kamel B). Envoie
 * l'email au client, puis marque Lead.noMatchNotifiedAt pour eviter les
 * doublons (un seul email par lead, jamais re-notifie).
 *
 * Conditions de candidature :
 *  - status != ACCEPTED (PENDING_MATCH, ASSIGNED — pas encore signe)
 *  - matchingStartedAt < NOW - 24h (le matching a tourne il y a +24h)
 *  - noMatchNotifiedAt IS NULL (jamais envoye)
 *  - deletedAt IS NULL (lead pas soft-delete)
 *  - aucune LeadAssignment ACCEPTED (defense en profondeur)
 *
 * V1 : un seul follow-up par lead. La spec Kamel mentionne 24h/48h ;
 * le wording de l'email annonce qu'on re-contactera "d'ici 48h" mais
 * V2 traitera la 2e relance. Pour V1, on couvre le besoin principal :
 * "le client doit savoir qu'on cherche encore".
 *
 * NB : l'envoi email reel + le marquage noMatchNotifiedAt seront ajoutes
 *      au commit suivant (P4.15) — ici on pose l'infrastructure : auth,
 *      query candidats, response stats. Run idempotent : un cron qui
 *      execute deux fois ne pose pas probleme (les candidats ne sont
 *      pas encore consommes).
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

  try {
    // Query raw : evite la dependance au type Prisma noMatchNotifiedAt
    // pour le commit P4.14 (Prisma client pas encore regenere sur
    // Windows ; le champ existe en BDD via migration sprint_no_match).
    // P4.15 basculera vers prisma.lead.update() typed pour le marquage.
    const candidates = await prisma.$queryRaw<NoMatchCandidate[]>`
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
    Sentry.captureException(err, {
      tags: { area: "cron", phase: "check-no-match-leads" },
    });
    stats.errors.push(`query: ${msg}`);
  }

  return NextResponse.json({ ok: true, ...stats });
}
