/**
 * Regles de decision du matching, isolees en fonctions pures.
 *
 * Elles vivent ici — et pas inline dans le SQL ou dans `assign.ts` — parce
 * que ce sont exactement les endroits ou le matching s'est deja trompe en
 * silence : le sentinel `-1` interprete comme une distance, un auto-accept
 * declenche sur un lead qu'il ne fallait pas acheter a l'aveugle, un lead
 * deja plein reassigne. Une regle pure est testable sans base de donnees
 * (cf. `eligibility.test.ts`) ; une regle noyee dans une requete ne l'est
 * qu'en environnement complet.
 *
 * Le SQL reste responsable de RAMENER les donnees (distance calculee,
 * nombre d'acceptations, abonnements du pro) ; ces fonctions decident.
 */

/**
 * Borne de distance effective, en km, pour une valeur de rayon issue de la
 * base. `-1` (et par prudence tout negatif) est le sentinel "OPEN / toute la
 * zone", present des deux cotes du matching :
 *   - `Lead.currentRadiusKm` = -1 : le lead a atteint le palier OPEN ;
 *   - `ProProfile.interventionRadiusKm` = -1 : le pro couvre toute la zone.
 *
 * Le traduire en borne infinie est indispensable : compare tel quel, `-1`
 * est plus petit que n'importe quelle distance reelle (toujours >= 0), donc
 * `distance <= -1` est TOUJOURS faux. C'est le bug qui empechait un pro
 * configure "partout" de matcher quoi que ce soit, a tous les paliers.
 */
export function radiusCapKm(radiusKm: number): number {
  return radiusKm < 0 ? Number.POSITIVE_INFINITY : radiusKm;
}

/**
 * Un lead est-il a portee d'un pro ?
 *
 * Double plafond, et les deux comptent :
 *   - le palier courant du lead : l'elargissement est progressif (30 → 60 →
 *     OPEN), un pro lointain ne doit pas voir un lead encore au palier 0 —
 *     le cron l'y amenera a l'heure dite ;
 *   - le rayon d'intervention du pro : il choisit jusqu'ou il se deplace, le
 *     systeme ne le force jamais au-dela, meme au palier OPEN.
 *
 * @param input.distanceKm               distance pro↔lead (calculee en SQL)
 * @param input.leadCurrentRadiusKm      `Lead.currentRadiusKm` (-1 = OPEN)
 * @param input.proInterventionRadiusKm  `ProProfile.interventionRadiusKm`
 *                                       (-1 = toute la zone)
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

/**
 * Reste-t-il une place d'acheteur sur ce lead ?
 *
 * Un lead exclusif se ferme au premier acheteur ; un lead partage au
 * `SHARED_LEAD_MAX_ACCEPTANCES`-ieme (AppConfig, 3 par defaut). Au-dela, on
 * n'assigne plus personne : le client ne doit pas etre rappele par six pros.
 */
export function leadHasRoom(input: {
  acceptedCount: number;
  isExclusive: boolean;
  sharedMaxAcceptances: number;
}): boolean {
  const max = input.isExclusive ? 1 : input.sharedMaxAcceptances;
  return input.acceptedCount < max;
}

/**
 * L'auto-accept doit-il se declencher pour ce pro sur ce lead ?
 *
 * Deux conditions evidentes (le pro l'a active, son wallet suit) et une qui
 * l'est moins : **jamais sur une categorie fourre-tout**. Ces leads partent a
 * tout pro de la zone, y compris a des metiers qui n'ont rien demande ;
 * declencher un achat automatique dessus debiterait un electricien pour une
 * demande de terrassement. Le pro garde donc son auto-accept pour ses
 * categories habituelles, et lit celles-la avant de decider.
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
