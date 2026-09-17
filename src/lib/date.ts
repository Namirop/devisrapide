// Le runtime Vercel est en UTC : sans `timeZone` explicite, un affichage
// serait décalé d'1 h ou 2 h en production seulement. Pour tout affichage de
// date/heure, utiliser formatDateTimeBE. Les bornes de mois ci-dessous
// suivent, elles, le fuseau du runtime.
const BE_TIME_ZONE = "Europe/Brussels";

export function formatDateTimeBE(
  d: Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  },
): string {
  return d.toLocaleString("fr-BE", { ...options, timeZone: BE_TIME_ZONE });
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function startOfPreviousMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
}

export function endOfPreviousMonth(d: Date): Date {
  return startOfMonth(d);
}
