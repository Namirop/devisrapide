// Helpers Date sans dependance externe (pas de date-fns). Utilises pour
// le bornage mensuel des stats dashboard pro + cron expansion.

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function startOfPreviousMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
}

export function endOfPreviousMonth(d: Date): Date {
  return startOfMonth(d);
}
