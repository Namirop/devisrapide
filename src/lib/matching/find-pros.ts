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
 * + un perimetre geographique donne. Appele par :
 *
 * 1. `matchLead` lors de la creation du lead (1ere passe, palier 0 = 30km).
 * 2. Le cron de process-leads aux paliers 2 (60km) et 3 (OPEN = null).
 *
 * Logique :
 * - `validationStatus = VALIDATED` (excluant PENDING / REJECTED / SUSPENDED).
 * - Pro inscrit a la *categorie* du lead (le matching ne tient pas compte
 *   du niveau sous-categorie : un pro Plomberie recoit toutes les
 *   variantes Plomberie). **Exception** : si la categorie est marquee
 *   `isCatchAll` (l'univers "Autre"), ce filtre saute et tout pro valide de
 *   la zone est retenu — personne ne s'abonne a "Autre", donc ces leads ne
 *   matchaient personne. L'auto-accept est neutralise en face, cote
 *   `assignLeadToPros` (cf. `shouldAutoAcceptLead`).
 * - Si `radiusKm` est fourni : filtre via la fonction SQL `haversine_km`
 *   sur (pro.lat/lng, lead.lat/lng) avec un seuil = `min(radiusKm,
 *   pro.interventionRadiusKm)`. Le pro choisit son rayon max, le systeme
 *   ne le force pas a etre alerte au-dela.
 * - Si `radiusKm` est `null` : palier OPEN, le seuil tombe a
 *   `pro.interventionRadiusKm` seul. Un pro configure a 30km ne sera
 *   donc pas alerte sur un lead a 80km, meme en OPEN.
 * - `pro.interventionRadiusKm = -1` = "toute la zone" (sentinel OPEN cote
 *   pro) : traite comme une borne infinie (le pro matche partout, cape
 *   seulement par le palier courant).
 *
 * Ordre de retour = **rotation equitable**, du pro servi il y a le plus
 * longtemps au plus recemment servi (`lastLeadReceivedAt ASC NULLS FIRST`,
 * donc les nouveaux inscrits d'abord ; `id` en tie-breaker pour un ordre
 * deterministe). Cet ordre n'est pas cosmetique : `assignLeadToPros`
 * parcourt la liste sequentiellement, et les pros en auto-accept achetent
 * dans cet ordre jusqu'a epuisement du plafond d'acceptations. Sans
 * `ORDER BY`, PostgreSQL renvoyait l'ordre physique de la table (~ordre
 * d'inscription), identique a chaque lead : les memes pros rafflaient
 * systematiquement les places, et les derniers inscrits n'en voyaient
 * jamais une. `lastLeadReceivedAt` etait deja ecrit a chaque assignation
 * mais n'etait lu nulle part.
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

  // `interventionRadiusKm = -1` est le sentinel "toute la zone" : le pro
  // couvre partout, sans plafond de distance. Sans ce mapping, LEAST(30, -1)
  // vaut -1 et la condition `distance <= -1` est TOUJOURS fausse (la distance
  // est >= 0) → un pro "partout" ne matchait jamais aucun lead, a aucun
  // palier. On le remappe vers une borne effectivement infinie.
  const proRadiusCap = Prisma.sql`(CASE WHEN pp."interventionRadiusKm" < 0 THEN 1000000 ELSE pp."interventionRadiusKm" END)`;

  // Filtres dynamiques composes via Prisma.sql pour conserver le binding
  // de parametres (zero concatenation de strings, zero risque d'injection).
  const distanceFilter =
    radiusKm === null
      ? Prisma.sql`haversine_km(pp."latitude", pp."longitude", ${lead.latitude}, ${lead.longitude}) <= ${proRadiusCap}`
      : Prisma.sql`haversine_km(pp."latitude", pp."longitude", ${lead.latitude}, ${lead.longitude}) <= LEAST(${radiusKm}::int, ${proRadiusCap})`;

  const exclusionFilter =
    excludeProIds.length > 0
      ? Prisma.sql`AND pp."id" NOT IN (${Prisma.join(excludeProIds)})`
      : Prisma.empty;

  // Le filtre metier est porte par le JOIN lui-meme, pas par une condition
  // WHERE : sur une categorie fourre-tout on retire la jointure entiere. La
  // garder en neutralisant seulement la condition multiplierait les lignes
  // par le nombre d'abonnements du pro (1 pro inscrit a 4 categories =
  // 4 lignes = 4 tentatives d'assignment, dont 3 rejetees par la contrainte
  // d'unicite [leadId, proProfileId]).
  const categoryJoin = isCatchAll
    ? Prisma.empty
    : Prisma.sql`JOIN "ProCategory" pc ON pc."proProfileId" = pp."id" AND pc."categoryId" = ${categoryId}`;

  // Seq scan assume : `haversine_km(...) <= X` n'est pas sargable, donc
  // aucun index ne peut servir ici — y compris `ProProfile_latitude_idx`,
  // qui ne sera pas utilise faute de predicat direct sur la colonne.
  // Suffisant pour les volumes V1 (quelques milliers de pros BE). Si ca
  // devient chaud : pre-filtre bounding-box explicite sur latitude /
  // longitude AVANT le haversine, la l'index jouera.
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
