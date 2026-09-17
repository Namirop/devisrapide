import type { LeadUrgency } from "@prisma/client";

/** Modulateur d'urgence : un chantier urgent vaut plus cher pour le pro. */
const URGENCY_MULTIPLIER: Record<LeadUrgency, number> = {
  URGENT: 1.3,
  SOON: 1.1,
  PLANNED: 1.0,
  FLEXIBLE: 0.9,
};

/**
 * Prix partagé/exclusif figés à la création du lead : prix de la
 * (sous-)catégorie × urgence, arrondis au centime (cf. docs/conventions.md).
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
 * Lit le snapshot du lead sans recalcul : un changement de grille tarifaire
 * n'affecte pas les leads existants.
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
