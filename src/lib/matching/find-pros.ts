import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Pro retourne par `findMatchingPros`. On garde uniquement les colonnes
 * necessaires a l'assignment downstream pour eviter de trimballer tout
 * l'objet ProProfile (qui a beaucoup de relations).
 */
export type MatchablePro = {
  id: string;
  userId: string;
  companyName: string;
  autoAccept: boolean;
  walletBalanceCents: number;
  notifyByEmail: boolean;
};

/**
 * Trouve les pros eligibles a recevoir un lead pour une (sous-)categorie
 * + un perimetre geographique donne. Sprint 2a — appele par :
 *
 * 1. `matchLead` lors de la creation du lead (1ere passe, palier 0 = 30km).
 * 2. Le cron de process-leads aux paliers 2 (60km) et 3 (OPEN = null).
 *
 * Logique :
 * - `validationStatus = VALIDATED` (excluant PENDING / REJECTED / SUSPENDED).
 * - Pro inscrit a la *categorie* du lead (le matching ne tient pas compte
 *   du niveau sous-categorie : un pro Plomberie recoit toutes les
 *   variantes Plomberie).
 * - Si `radiusKm` est fourni : filtre via la fonction SQL `haversine_km`
 *   sur (pro.lat/lng, lead.lat/lng) avec un seuil = `min(radiusKm,
 *   pro.interventionRadiusKm)`. Le pro choisit son rayon max, le systeme
 *   ne le force pas a etre alerte au-dela.
 * - Si `radiusKm` est `null` : palier OPEN, le seuil tombe a
 *   `pro.interventionRadiusKm` seul. Un pro configure a 30km ne sera
 *   donc pas alerte sur un lead a 80km, meme en OPEN.
 *
 * @param input.leadId         id du Lead a matcher
 * @param input.radiusKm       seuil de distance en km, ou `null` pour OPEN
 * @param input.excludeProIds  pros deja assignes a ce lead (passes
 *                             d'elargissement zone : pas de re-assignment).
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
      subCategory: { select: { categoryId: true } },
    },
  });
  if (!lead) throw new Error(`Lead introuvable: ${leadId}`);

  const categoryId = lead.subCategory.categoryId;

  // Filtres dynamiques composes via Prisma.sql pour conserver le binding
  // de parametres (zero concatenation de strings, zero risque d'injection).
  const distanceFilter =
    radiusKm === null
      ? Prisma.sql`haversine_km(pp."latitude", pp."longitude", ${lead.latitude}, ${lead.longitude}) <= pp."interventionRadiusKm"`
      : Prisma.sql`haversine_km(pp."latitude", pp."longitude", ${lead.latitude}, ${lead.longitude}) <= LEAST(${radiusKm}::int, pp."interventionRadiusKm")`;

  const exclusionFilter =
    excludeProIds.length > 0
      ? Prisma.sql`AND pp."id" NOT IN (${Prisma.join(excludeProIds)})`
      : Prisma.empty;

  // Index `ProProfile_latitude_idx` aide PostgreSQL a faire un pre-filtre
  // bounding-box avant d'appliquer le haversine complet. Suffisant pour
  // les volumes V1 (quelques milliers de pros BE).
  const rows = await prisma.$queryRaw<MatchablePro[]>`
    SELECT
      pp."id"                 AS "id",
      pp."userId"             AS "userId",
      pp."companyName"        AS "companyName",
      pp."autoAccept"         AS "autoAccept",
      pp."walletBalanceCents" AS "walletBalanceCents",
      pp."notifyByEmail"      AS "notifyByEmail"
    FROM "ProProfile" pp
    JOIN "ProCategory" pc ON pc."proProfileId" = pp."id"
    WHERE pp."validationStatus" = 'VALIDATED'
      AND pc."categoryId" = ${categoryId}
      AND ${distanceFilter}
      ${exclusionFilter}
  `;

  return rows;
}
