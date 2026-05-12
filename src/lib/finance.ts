/**
 * Utilitaires finance BE : TVA, formats monetaires, normalisation TVA pro.
 */

// Taux TVA standard BE (21%). Reduit a 6/12% selon nature des travaux mais
// au launch on calcule au taux standard. Les overrides metier viendront
// plus tard via AppConfig si besoin.
export const VAT_RATE_BE = 0.21;

/**
 * Calcule un montant TTC depuis un HT (centimes ou euros, indifferent —
 * meme unite en entree/sortie). Arrondi a l'entier le plus proche.
 *
 * Ex : calculateTTC(1000) = 1210 (10€ HT -> 12,10€ TTC en centimes).
 */
export function calculateTTC(amountHt: number): number {
  return Math.round(amountHt * (1 + VAT_RATE_BE));
}

/**
 * Formate un montant en centimes au format BE : "1 234,56 €".
 * Utilise espace insecable comme separateur de milliers (BE = locale fr-BE).
 *
 * Note : fr-BE utilise virgule comme separateur decimal et espace pour les
 * milliers. On force le rendu avec Intl pour rester coherent serveur/client
 * (sinon le formatage est dependant de la locale du navigateur).
 */
export function formatAmountBE(amountCents: number): string {
  const euros = amountCents / 100;
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

// ─── TVA pro (BE0123456789) ─────────────────────────────────

/**
 * Regex stricte pour un numero TVA belge normalise : "BE" suivi de 10
 * chiffres. Appliquer apres normalizeVatBE.
 */
export const vatBeRegex = /^BE\d{10}$/;

/**
 * Normalise une saisie utilisateur (espaces, points, tirets, casse) vers
 * la forme canonique BE0123456789. Ne valide pas — applique vatBeRegex
 * ensuite si necessaire.
 *
 * Tolere : "BE 0123 456 789", "be0123.456.789", "0123456789" (ajoute le BE).
 */
export function normalizeVatBE(input: string): string {
  const cleaned = input.replace(/[\s.\-_]/g, "").toUpperCase();
  if (/^\d{10}$/.test(cleaned)) return `BE${cleaned}`;
  return cleaned;
}
