/**
 * Hors rendu : react-hooks/purity signale `Date.now()` dans un Server
 * Component (faux positif) mais ne suit pas les appels à un module externe.
 */

export function nowMinusHours(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
