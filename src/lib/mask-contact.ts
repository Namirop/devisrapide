/**
 * Masque les coordonnees ecrites en clair dans un texte libre.
 *
 * Le champ "description" du formulaire client est montre aux pros AVANT
 * l'achat (page detail du lead, extrait dans le push). C'est le seul
 * endroit ou la regle « aucune coordonnee client tant que l'assignment
 * n'est pas ACCEPTED » peut fuir en pratique : les particuliers ecrivent
 * regulierement « rappelez-moi au 0470... » dans le texte du projet, et
 * tous les pros matches recevaient alors le numero sans payer.
 *
 * Le parti pris est de masquer les MOTIFS de contact, pas le texte : la
 * description du chantier reste integralement lisible, donc l'apercu
 * garde sa valeur commerciale. Le pro qui achete voit le texte d'origine,
 * jamais masque.
 *
 * Ce n'est pas une garantie forte — un numero ecrit en toutes lettres
 * passe — mais ca couvre la forme repandue sans degrader l'aperçu.
 */

/** Adresses email : forme standard, suffisamment stricte pour eviter les faux positifs. */
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

/**
 * Suites d'au moins 9 chiffres, separateurs de mise en forme tolères
 * (espace, point, tiret, slash, parentheses) et prefixe international
 * optionnel. Couvre les formes belges usuelles : 0470 12 34 56,
 * +32 470 123 456, 02/123.45.67.
 *
 * Le seuil est a 9 et non 8 pour ne pas avaler une date : « 12/03/2026 »
 * ne compte que 8 chiffres, et un client qui propose un creneau
 * d'intervention doit rester lisible.
 */
const PHONE_PATTERN = /(?:\+|00)?\d(?:[\s.\-/()]*\d){8,}/g;

const MASK = "[coordonnées masquées]";

export function maskContactDetails(text: string): string {
  return text.replace(EMAIL_PATTERN, MASK).replace(PHONE_PATTERN, MASK);
}
