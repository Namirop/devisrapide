/**
 * Masque emails et numéros écrits en clair dans une description montrée aux
 * pros avant achat ; le texte du chantier reste lisible et l'acheteur voit
 * l'original. Limite connue : un numéro écrit en toutes lettres passe.
 */

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

// 9 chiffres minimum, séparateurs et préfixe international tolérés
// (0470 12 34 56, +32 470 123 456) ; pas 8, pour épargner « 12/03/2026 ».
const PHONE_PATTERN = /(?:\+|00)?\d(?:[\s.\-/()]*\d){8,}/g;

const MASK = "[coordonnées masquées]";

export function maskContactDetails(text: string): string {
  return text.replace(EMAIL_PATTERN, MASK).replace(PHONE_PATTERN, MASK);
}
