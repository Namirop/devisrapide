import type { LeadUrgency } from "@prisma/client";

/**
 * Coefficients multiplicateurs appliques au prix de base d'un lead selon
 * l'urgence renseignee par le client. Calibre V1 :
 *
 * - URGENT   : +30%   (intervention sous 24-48h, le pro peut facturer
 *              "urgence" au client final, donc le lead vaut plus).
 * - SOON     : +10%   (intervention sous la semaine, leger premium).
 * - PLANNED  : =      (intervention sous le mois, baseline).
 * - FLEXIBLE : -10%   (pas de date imposee, le pro a moins de pression
 *              donc le lead vaut un peu moins cher).
 *
 * Ces coefficients seront migres en `AppConfig` au Sprint 4 (panel admin)
 * pour permettre à l'admin d'ajuster sans redéploiement.
 */
const URGENCY_MULTIPLIER: Record<LeadUrgency, number> = {
  URGENT: 1.3,
  SOON: 1.1,
  PLANNED: 1.0,
  FLEXIBLE: 0.9,
};

/**
 * Calcule les snapshots de prix d'un lead (partage + exclusif) en partant
 * des prix par defaut de la (sous-)categorie et en appliquant le
 * modulateur d'urgence. Resultat en centimes (Int), conforme a la
 * convention monetaire du projet (cf. CLAUDE.md).
 *
 * @example
 *   computeLeadBasePrice({
 *     sharedPriceCents: 2500,      // 25€ pour Plomberie partage
 *     exclusivePriceCents: 6250,   // 62,50€ pour Plomberie exclusif
 *     urgency: "URGENT",
 *   })
 *   // -> { sharedCents: 3250, exclusiveCents: 8125 }
 *   //    (25€ x 1.3 = 32,50€ ; 62,50€ x 1.3 = 81,25€)
 *
 * @example
 *   computeLeadBasePrice({
 *     sharedPriceCents: 2000,
 *     exclusivePriceCents: 5000,
 *     urgency: "FLEXIBLE",
 *   })
 *   // -> { sharedCents: 1800, exclusiveCents: 4500 }
 *
 * @param input.sharedPriceCents     prix de base pour un lead partage (centimes)
 * @param input.exclusivePriceCents  prix de base pour un lead exclusif (centimes)
 * @param input.urgency              valeur LeadUrgency renseignee par le client
 * @returns                          snapshots arrondis a l'entier inferieur
 */
export function computeLeadBasePrice(input: {
  sharedPriceCents: number;
  exclusivePriceCents: number;
  urgency: LeadUrgency;
}): { sharedCents: number; exclusiveCents: number } {
  const multiplier = URGENCY_MULTIPLIER[input.urgency];
  return {
    sharedCents: Math.round(input.sharedPriceCents * multiplier),
    exclusiveCents: Math.round(input.exclusivePriceCents * multiplier),
  };
}

/**
 * Determine le prix qu'un pro paiera pour accepter un lead, selon que
 * l'assignment lui est propose en mode partage ou exclusif. Les deux
 * prix sont deja pre-calcules sur le `Lead` au moment de sa creation
 * (cf. `computeLeadBasePrice` + snapshot dans `createLead`), donc on
 * lit juste le bon snapshot ici — pas de recalcul a la volee.
 *
 * @example
 *   computeAssignmentPrice({
 *     lead: { sharedLeadPriceCentsSnapshot: 3250, exclusiveLeadPriceCentsSnapshot: 8125 },
 *     isExclusive: false,
 *   })
 *   // -> 3250
 *
 * @param input.lead         lead avec ses 2 snapshots de prix
 * @param input.isExclusive  true si l'assignment est exclusif (1 seul pro)
 * @returns                  prix en centimes
 */
export function computeAssignmentPrice(input: {
  lead: {
    sharedLeadPriceCentsSnapshot: number;
    exclusiveLeadPriceCentsSnapshot: number;
  };
  isExclusive: boolean;
}): number {
  return input.isExclusive
    ? input.lead.exclusiveLeadPriceCentsSnapshot
    : input.lead.sharedLeadPriceCentsSnapshot;
}
