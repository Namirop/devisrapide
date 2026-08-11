// Helpers Date sans dependance externe (pas de date-fns). Utilises pour
// le bornage mensuel des stats dashboard pro + cron expansion.

// Fuseau horaire d'affichage. Le serveur (Vercel) tourne en UTC quel que
// soit l'environnement : sans `timeZone` explicite, `toLocaleString`
// utilise le fuseau du runtime (UTC), pas celui de la Belgique — d'ou un
// decalage de 2h (CEST) ou 1h (CET) invisible en dev local (poste en
// heure belge) mais visible en prod. Toujours passer par ce helper pour
// tout affichage de date/heure cote utilisateur (fr-BE).
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
