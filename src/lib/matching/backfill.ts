import { getAppConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

import { isWithinReach, leadHasRoom } from "./eligibility";

/** Garde-fou : une anomalie de données ne doit pas inonder un dashboard. */
const BACKFILL_MAX_LEADS = 30;

/** Garde-fou sur la requête de candidats, avant filtrage métier en TS. */
const CANDIDATE_SCAN_LIMIT = 200;

type CandidateRow = {
  id: string;
  isExclusive: boolean;
  expiresAt: Date;
  currentRadiusKm: number;
  sharedLeadPriceCentsSnapshot: number;
  exclusiveLeadPriceCentsSnapshot: number;
  distanceKm: number;
  acceptedCount: number;
};

/**
 * Matching à l'envers : crée en PENDING les assignments manquants d'un pro
 * sur les leads vivants qui lui correspondent. « Leads disponibles » lit les
 * assignments écrits au matching : sans ce rattrapage, un pro devenu éligible
 * après la création d'un lead ne le verrait pas.
 *
 * Volontairement sans auto-accept (pas de débit groupé sur des leads jamais
 * vus), sans notification (l'appelant annonce le total) et sans toucher
 * `lastLeadReceivedAt` (un rattrapage n'est pas un tour de rotation).
 */
export async function backfillLeadsForPro(input: {
  proProfileId: string;
}): Promise<number> {
  const { proProfileId } = input;

  const pro = await prisma.proProfile.findUnique({
    where: { id: proProfileId },
    select: {
      userId: true,
      validationStatus: true,
      latitude: true,
      longitude: true,
      interventionRadiusKm: true,
    },
  });

  if (!pro || pro.validationStatus !== "VALIDATED") return 0;

  const sharedMaxAcceptances = await getAppConfig(
    "SHARED_LEAD_MAX_ACCEPTANCES",
    "int",
  );

  // Le SQL filtre ce qu'il fait mieux (lead vivant, métier, pas déjà
  // assigné) ; portée et place restante sont tranchées par eligibility.ts.
  const candidates = await prisma.$queryRaw<CandidateRow[]>`
    SELECT
      l."id"                              AS "id",
      l."isExclusive"                     AS "isExclusive",
      l."expiresAt"                       AS "expiresAt",
      l."currentRadiusKm"                 AS "currentRadiusKm",
      l."sharedLeadPriceCentsSnapshot"    AS "sharedLeadPriceCentsSnapshot",
      l."exclusiveLeadPriceCentsSnapshot" AS "exclusiveLeadPriceCentsSnapshot",
      haversine_km(${pro.latitude}, ${pro.longitude}, l."latitude", l."longitude") AS "distanceKm",
      (
        SELECT count(*)::int
        FROM "LeadAssignment" la2
        WHERE la2."leadId" = l."id" AND la2."status" = 'ACCEPTED'
      ) AS "acceptedCount"
    FROM "Lead" l
    JOIN "SubCategory" sc ON sc."id" = l."subCategoryId"
    JOIN "Category" c ON c."id" = sc."categoryId"
    WHERE l."deletedAt" IS NULL
      AND l."status" IN ('PENDING_MATCH', 'ASSIGNED')
      AND l."expiresAt" IS NOT NULL
      AND l."expiresAt" > now()
      -- Metier : abonne a la categorie, ou categorie fourre-tout (personne
      -- ne s'y abonne, cf. Category.isCatchAll).
      AND (
        c."isCatchAll" = true
        OR EXISTS (
          SELECT 1 FROM "ProCategory" pc
          WHERE pc."proProfileId" = ${proProfileId}
            AND pc."categoryId" = c."id"
        )
      )
      -- Idempotence : un lead deja dans sa boite aux lettres n'y retourne
      -- pas, quel que soit le statut de la ligne (un REFUSE reste refuse).
      AND NOT EXISTS (
        SELECT 1 FROM "LeadAssignment" la
        WHERE la."leadId" = l."id"
          AND la."proProfileId" = ${proProfileId}
      )
    ORDER BY l."createdAt" DESC
    LIMIT ${CANDIDATE_SCAN_LIMIT}
  `;

  const eligible = candidates
    .filter(
      (lead) =>
        isWithinReach({
          distanceKm: lead.distanceKm,
          leadCurrentRadiusKm: lead.currentRadiusKm,
          proInterventionRadiusKm: pro.interventionRadiusKm,
        }) &&
        leadHasRoom({
          acceptedCount: lead.acceptedCount,
          isExclusive: lead.isExclusive,
          sharedMaxAcceptances,
        }),
    )
    .slice(0, BACKFILL_MAX_LEADS);

  if (eligible.length === 0) return 0;

  // Le cron peut assigner le même lead entre SELECT et INSERT : la contrainte
  // [leadId, proProfileId] tranche, skipDuplicates évite l'exception.
  const { count } = await prisma.leadAssignment.createMany({
    data: eligible.map((lead) => ({
      leadId: lead.id,
      proProfileId,
      proUserId: pro.userId,
      priceCents: lead.isExclusive
        ? lead.exclusiveLeadPriceCentsSnapshot
        : lead.sharedLeadPriceCentsSnapshot,
      isExclusive: lead.isExclusive,
      status: "PENDING" as const,
      radiusKmAtAssignment: lead.currentRadiusKm,
      expiresAt: lead.expiresAt,
    })),
    skipDuplicates: true,
  });

  return count;
}
