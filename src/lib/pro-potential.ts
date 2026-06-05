// Table de potentiel de leads / mois pour le calculateur du landing pro.
// Valeurs V1 hardcodees, calibres "raisonnables" par recoupement metier +
// densite urbaine BE. Pas issues d'un backend (Sprint 2+ remplacera par
// des vraies requetes count + matching geo).
//
// Cle externe = slug categorie Travaux. Cle interne = commune normalisee
// ou "default". Valeur = { min, max } leads / mois.

type Range = { min: number; max: number };

const POTENTIAL: Record<string, Record<string, Range>> = {
  toiture: {
    bruxelles: { min: 12, max: 22 },
    liege: { min: 8, max: 16 },
    namur: { min: 6, max: 12 },
    charleroi: { min: 9, max: 18 },
    mons: { min: 5, max: 10 },
    tournai: { min: 4, max: 9 },
    "la-louviere": { min: 5, max: 11 },
    default: { min: 4, max: 9 },
  },
  plomberie: {
    bruxelles: { min: 18, max: 32 },
    liege: { min: 14, max: 26 },
    namur: { min: 10, max: 20 },
    charleroi: { min: 13, max: 24 },
    mons: { min: 8, max: 16 },
    tournai: { min: 7, max: 14 },
    "la-louviere": { min: 9, max: 18 },
    default: { min: 6, max: 14 },
  },
  electricite: {
    bruxelles: { min: 16, max: 28 },
    liege: { min: 12, max: 22 },
    namur: { min: 9, max: 18 },
    charleroi: { min: 11, max: 22 },
    mons: { min: 7, max: 14 },
    tournai: { min: 6, max: 13 },
    "la-louviere": { min: 8, max: 16 },
    default: { min: 6, max: 13 },
  },
  chauffage: {
    bruxelles: { min: 14, max: 24 },
    liege: { min: 11, max: 20 },
    namur: { min: 8, max: 16 },
    charleroi: { min: 10, max: 19 },
    mons: { min: 6, max: 12 },
    tournai: { min: 5, max: 11 },
    "la-louviere": { min: 7, max: 14 },
    default: { min: 5, max: 11 },
  },
  peinture: {
    bruxelles: { min: 10, max: 18 },
    liege: { min: 7, max: 14 },
    namur: { min: 5, max: 11 },
    charleroi: { min: 7, max: 13 },
    mons: { min: 4, max: 9 },
    tournai: { min: 4, max: 8 },
    "la-louviere": { min: 5, max: 10 },
    default: { min: 3, max: 8 },
  },
  menuiserie: {
    bruxelles: { min: 11, max: 20 },
    liege: { min: 8, max: 15 },
    namur: { min: 6, max: 12 },
    charleroi: { min: 7, max: 14 },
    mons: { min: 4, max: 9 },
    tournai: { min: 4, max: 8 },
    "la-louviere": { min: 5, max: 10 },
    default: { min: 4, max: 9 },
  },
  maconnerie: {
    bruxelles: { min: 9, max: 16 },
    liege: { min: 6, max: 13 },
    namur: { min: 5, max: 10 },
    charleroi: { min: 7, max: 13 },
    mons: { min: 4, max: 9 },
    tournai: { min: 3, max: 8 },
    "la-louviere": { min: 5, max: 10 },
    default: { min: 3, max: 8 },
  },
  carrelage: {
    bruxelles: { min: 8, max: 15 },
    liege: { min: 6, max: 12 },
    namur: { min: 4, max: 10 },
    charleroi: { min: 5, max: 11 },
    mons: { min: 3, max: 7 },
    tournai: { min: 3, max: 7 },
    "la-louviere": { min: 4, max: 9 },
    default: { min: 3, max: 7 },
  },
};

// Valeur moyenne estimee d'un chantier (en euros) par metier. V1 hardcode,
// calibre "raisonnable" par metier BE (toiture/maconnerie = gros oeuvre cher,
// plomberie = depannage moins cher). Sert au 2e chiffre du calculateur de
// potentiel, a cote du nb de leads/mois. Tilde + eyebrow "estime" a
// l'affichage = moyenne indicative, pas une promesse.
const AVG_JOB_VALUE_EUR: Record<string, number> = {
  toiture: 3500,
  plomberie: 800,
  electricite: 1200,
  chauffage: 2500,
  peinture: 1500,
  menuiserie: 2200,
  maconnerie: 3000,
  carrelage: 1800,
};

const AVG_JOB_VALUE_DEFAULT = 1200;

export const PRO_CITIES = [
  { value: "bruxelles", label: "Bruxelles" },
  { value: "liege", label: "Liège" },
  { value: "namur", label: "Namur" },
  { value: "charleroi", label: "Charleroi" },
  { value: "mons", label: "Mons" },
  { value: "tournai", label: "Tournai" },
  { value: "la-louviere", label: "La Louvière" },
  { value: "default", label: "Autre commune" },
] as const;

export function getPotentialRange(
  categorySlug: string,
  cityKey: string,
): Range | null {
  const byCity = POTENTIAL[categorySlug];
  if (!byCity) return null;
  return byCity[cityKey] ?? byCity.default ?? null;
}

export function getAvgJobValueEur(categorySlug: string): number {
  return AVG_JOB_VALUE_EUR[categorySlug] ?? AVG_JOB_VALUE_DEFAULT;
}
