/**
 * Helpers stats partages dashboard pro. Calcul du delta % vs mois precedent
 * avec gestion explicite des divisions par zero et formatages monetaires
 * conformes a la convention projet (centimes Int → string locale fr).
 */

/** Resultat d'un calcul de delta. Discriminated union pour rendre les
 *  edge cases explicites cote UI (pas de "+Infinity%" affiche). */
export type DeltaResult =
  | { kind: "delta"; value: number } // current > 0 ou < 0, previous > 0
  | { kind: "new" } // previous = 0, current > 0 → "Nouveau"
  | { kind: "none" }; // previous = 0 ET current = 0 → "—" (rien a comparer)

/**
 * Calcule le delta % entre une valeur courante et une valeur precedente.
 *
 * @example
 *   computeDeltaPercent(120, 100) → { kind: "delta", value: 20 }
 *   computeDeltaPercent(80,  100) → { kind: "delta", value: -20 }
 *   computeDeltaPercent(50,    0) → { kind: "new" }
 *   computeDeltaPercent(0,     0) → { kind: "none" }
 */
export function computeDeltaPercent(
  current: number,
  previous: number,
): DeltaResult {
  if (previous === 0 && current === 0) return { kind: "none" };
  if (previous === 0) return { kind: "new" };
  const value = Math.round(((current - previous) / previous) * 100);
  return { kind: "delta", value };
}

/** Formate un delta pour l'affichage UI. */
export function formatDeltaLabel(delta: DeltaResult): string {
  switch (delta.kind) {
    case "new":
      return "Nouveau";
    case "none":
      return "—";
    case "delta":
      return delta.value >= 0 ? `+${delta.value}%` : `${delta.value}%`;
  }
}

/**
 * Formate un montant en centimes (Int) en string locale fr-BE.
 * Exemples : 3250 → "32,50 €", 100000 → "1 000,00 €".
 */
export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
