// Règles de décision du matching en fonctions pures, testables sans base
// (cf. `eligibility.test.ts`) : le SQL ramène les données, ces fonctions
// décident.

/**
 * Rayon effectif en km. Un négatif (`-1`) est le sentinel « OPEN » : lead au
 * dernier palier ou pro couvrant toute la zone. Comparé tel quel,
 * `distance <= -1` serait toujours faux.
 */
export function radiusCapKm(radiusKm: number): number {
  return radiusKm < 0 ? Number.POSITIVE_INFINITY : radiusKm;
}

/**
 * Double plafond : le palier courant du lead (élargissement progressif) et
 * le rayon d'intervention du pro, jamais dépassé même au palier OPEN.
 */
export function isWithinReach(input: {
  distanceKm: number;
  leadCurrentRadiusKm: number;
  proInterventionRadiusKm: number;
}): boolean {
  const cap = Math.min(
    radiusCapKm(input.leadCurrentRadiusKm),
    radiusCapKm(input.proInterventionRadiusKm),
  );
  return input.distanceKm <= cap;
}

/** Exclusif : un seul acheteur ; partagé : `SHARED_LEAD_MAX_ACCEPTANCES`. */
export function leadHasRoom(input: {
  acceptedCount: number;
  isExclusive: boolean;
  sharedMaxAcceptances: number;
}): boolean {
  const max = input.isExclusive ? 1 : input.sharedMaxAcceptances;
  return input.acceptedCount < max;
}

/**
 * Jamais d'auto-accept sur une catégorie fourre-tout : ces leads partent à
 * tous les pros de la zone, un achat automatique débiterait un pro pour un
 * métier qui n'est pas le sien.
 */
export function shouldAutoAcceptLead(input: {
  proAutoAccept: boolean;
  proBalanceCents: number;
  priceCents: number;
  isCatchAllCategory: boolean;
}): boolean {
  if (!input.proAutoAccept) return false;
  if (input.isCatchAllCategory) return false;
  return input.proBalanceCents >= input.priceCents;
}
