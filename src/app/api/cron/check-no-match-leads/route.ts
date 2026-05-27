import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";

import { sendNoMatchClientEmail } from "@/lib/email/sender";
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
 * Apres envoi email :
 *  - marque Lead.noMatchNotifiedAt = NOW() pour eviter les doublons.
 *  - L'update se fait via $executeRaw (le Prisma client doit etre
 *    regenere sur Windows pour exposer le champ ; le SQL fonctionne
 *    en attendant — le champ existe en BDD via migration).
 *
 * Idempotence : si un envoi email rate (Resend down) le marquage
 * noMatchNotifiedAt n'est pas applique → le lead sera re-tente au
 * prochain run. Si le marquage rate apres email envoye, on aura un
 * doublon au lendemain (acceptable, c'est un email d'info).
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
    Sentry.captureException(err, {
      tags: { area: "cron", phase: "check-no-match-leads" },
    });
    stats.errors.push(`query: ${msg}`);
  }

  // Pour chaque candidat : envoi email + marquage. Si l'email echoue,
  // on ne marque pas → retry au run suivant. Si le marquage echoue
  // apres email envoye, doublon possible au lendemain (acceptable).
  for (const lead of candidates) {
    try {
      await sendNoMatchClientEmail({
        to: lead.clientEmail,
        firstName: lead.clientFirstName,
        city: lead.city,
      });
      await prisma.$executeRaw`
        UPDATE "Lead"
        SET "noMatchNotifiedAt" = NOW()
        WHERE "id" = ${lead.id}
      `;
      stats.emailsSent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[cron/check-no-match-leads] lead failed", {
        leadId: lead.id,
        error: msg,
      });
      Sentry.captureException(err, {
        tags: { area: "cron", phase: "check-no-match-leads-send" },
        extra: { leadId: lead.id },
      });
      stats.errors.push(`lead ${lead.id}: ${msg}`);
    }
  }

  return NextResponse.json({ ok: true, ...stats });
}
