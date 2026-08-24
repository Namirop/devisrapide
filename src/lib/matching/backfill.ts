import { getAppConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

import { isWithinReach, leadHasRoom } from "./eligibility";

/**
 * Nombre maximum d'assignments crees en une passe de rattrapage. Les leads
 * vivent 72h, donc le volume reel est borne par l'activite de trois jours —
 * ce plafond n'est pas la pour trier, il est la pour qu'un incident de
 * donnees ne se traduise pas par 400 lignes deversees dans le dashboard d'un
 * pro qui vient d'etre valide.
 */
const BACKFILL_MAX_LEADS = 30;

/** Garde-fou sur la requete de candidats (avant filtrage metier en TS). */
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
 * Rejoue le matching **a l'envers** : un pro, tous les leads vivants qui lui
 * correspondent. Cree les `LeadAssignment` manquants en PENDING.
 *
 * ── Le trou que ca bouche ──────────────────────────────────────
 * "Leads disponibles" n'est pas une recherche, c'est une boite aux lettres :
 * l'ecran lit les `LeadAssignment` du pro, ecrits au moment du matching. Un
 * pro devenu eligible APRES la creation d'un lead n'a aucune ligne, donc une
 * liste vide — quand bien meme le metier et la zone correspondent.
 *
 * Le cron rattrapait ce cas par accident, et partiellement : ses passes
 * d'elargissement (30 → 60 → OPEN) re-cherchent les pros eligibles, donc un
 * pro valide dans les 4 premieres heures d'un lead etait ramasse. Passe le
 * dernier palier, plus aucune passe ne repasse — alors que le lead vit encore
 * 68h. C'est cette fenetre morte que cette fonction couvre.
 *
 * ── Ce qu'elle ne fait deliberement pas ────────────────────────
 * - **Aucun auto-accept.** Un pro valide avec un wallet charge se ferait
 *   debiter d'un coup pour dix leads vieux de deux jours, sans les avoir vus.
 *   Le rattrapage cree du PENDING, le pro achete s'il veut.
 * - **Aucune notification.** Dix leads rattrapes = dix emails + dix push a
 *   quelqu'un qui arrive sur son dashboard dans la seconde. Le comptage est
 *   remonte a l'appelant, qui l'annonce une fois (cf. l'email de validation).
 * - **Ne touche pas `lastLeadReceivedAt`.** Ce champ pilote la rotation
 *   equitable du prochain lead reel ; un rattrapage n'est pas un tour de
 *   distribution, et l'avoir compte comme tel enverrait le nouvel inscrit en
 *   fin de file juste apres son arrivee.
 *
 * @returns nombre d'assignments crees
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

  // Un pro non valide n'a pas acces au dashboard et ne peut rien acheter :
  // lui creer des assignments ne ferait qu'accumuler des lignes a nettoyer
  // s'il finit refuse.
  if (!pro || pro.validationStatus !== "VALIDATED") return 0;

  const sharedMaxAcceptances = await getAppConfig(
    "SHARED_LEAD_MAX_ACCEPTANCES",
    "int",
  );

  // Le SQL ramene les faits (distance, acceptations, abonnements), il ne
  // tranche pas : les regles de portee et de place restante sont des
  // fonctions pures testees (cf. eligibility.ts). Seuls les filtres que
  // Postgres fait mieux — lead vivant, metier, "pas deja assigne" — restent
  // ici, parce qu'ils evitent de remonter des lignes pour rien.
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

  // skipDuplicates : le cron peut assigner le meme lead au meme pro entre
  // notre SELECT et notre INSERT (il tourne toutes les 15 min et re-cherche
  // les pros a chaque palier). La contrainte [leadId, proProfileId] tranche,
  // on ne veut juste pas que ca leve.
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
