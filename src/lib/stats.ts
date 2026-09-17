/**
 * Delta vs période précédente. Union discriminée : la division par zéro
 * devient un cas explicite côté UI (« Nouveau », « — ») au lieu de
 * « +Infinity% ».
 */
export type DeltaResult =
  | { kind: "delta"; value: number }
  | { kind: "new" } // previous = 0, current > 0
  | { kind: "none" }; // previous = 0 et current = 0

export function computeDeltaPercent(
  current: number,
  previous: number,
): DeltaResult {
  if (previous === 0 && current === 0) return { kind: "none" };
  if (previous === 0) return { kind: "new" };
  const value = Math.round(((current - previous) / previous) * 100);
  return { kind: "delta", value };
}

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

/** Centimes entiers → montant fr-BE (3250 → « 32,50 € »). */
export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
