import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MatchablePro = {
  id: string;
  userId: string;
  companyName: string;
  autoAccept: boolean;
  walletBalanceCents: number;
  notifyByEmail: boolean;
};

/**
 * Pros éligibles à un lead : VALIDATED, abonnés à sa catégorie (sauf
 * catégorie fourre-tout, où personne ne s'abonne) et à portée : palier
 * `radiusKm` (`null` = OPEN) plafonné par le rayon d'intervention du pro.
 *
 * Ordre de rotation équitable (servi il y a le plus longtemps d'abord) : les
 * auto-accepts achètent dans cet ordre jusqu'au plafond d'acceptations.
 */
export async function findMatchingPros(input: {
  leadId: string;
  radiusKm: number | null;
  excludeProIds?: string[];
}): Promise<MatchablePro[]> {
  const { leadId, radiusKm, excludeProIds = [] } = input;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      latitude: true,
      longitude: true,
      subCategory: {
        select: {
          categoryId: true,
          category: { select: { isCatchAll: true } },
        },
      },
    },
  });
  if (!lead) throw new Error(`Lead introuvable: ${leadId}`);

  const categoryId = lead.subCategory.categoryId;
  const isCatchAll = lead.subCategory.category.isCatchAll;

  // Sentinel -1 = toute la zone : sans ce remap, LEAST(x, -1) rendrait la
  // condition de distance toujours fausse.
  const proRadiusCap = Prisma.sql`(CASE WHEN pp."interventionRadiusKm" < 0 THEN 1000000 ELSE pp."interventionRadiusKm" END)`;

  // Composés en Prisma.sql : paramètres liés, aucune concaténation.
  const distanceFilter =
    radiusKm === null
      ? Prisma.sql`haversine_km(pp."latitude", pp."longitude", ${lead.latitude}, ${lead.longitude}) <= ${proRadiusCap}`
      : Prisma.sql`haversine_km(pp."latitude", pp."longitude", ${lead.latitude}, ${lead.longitude}) <= LEAST(${radiusKm}::int, ${proRadiusCap})`;

  const exclusionFilter =
    excludeProIds.length > 0
      ? Prisma.sql`AND pp."id" NOT IN (${Prisma.join(excludeProIds)})`
      : Prisma.empty;

  // Fourre-tout : jointure retirée entière. Garder le JOIN sans condition
  // dupliquerait chaque pro autant de fois qu'il a d'abonnements.
  const categoryJoin = isCatchAll
    ? Prisma.empty
    : Prisma.sql`JOIN "ProCategory" pc ON pc."proProfileId" = pp."id" AND pc."categoryId" = ${categoryId}`;

  // Limite connue : `haversine_km(...) <= X` n'est pas sargable (seq scan).
  // À plus grand volume, pré-filtrer par bounding box sur latitude/longitude.
  const rows = await prisma.$queryRaw<MatchablePro[]>`
    SELECT
      pp."id"                 AS "id",
      pp."userId"             AS "userId",
      pp."companyName"        AS "companyName",
      pp."autoAccept"         AS "autoAccept",
      pp."walletBalanceCents" AS "walletBalanceCents",
      pp."notifyByEmail"      AS "notifyByEmail"
    FROM "ProProfile" pp
    ${categoryJoin}
    WHERE pp."validationStatus" = 'VALIDATED'
      AND ${distanceFilter}
      ${exclusionFilter}
    ORDER BY pp."lastLeadReceivedAt" ASC NULLS FIRST, pp."id" ASC
  `;

  return rows;
}
