// Calculateur de potentiel de la section ProPotential (/pros). Pour une famille
// de metier (= univers du catalogue, hors "Autre") et une zone, estime une
// fourchette de leads/mois et la valeur moyenne d'un chantier.

/**
 * Donnees sectorielles par FAMILLE de metier. Cle = slug d'univers du catalogue
 * (cf. prisma/seed.ts), ce qui matche 1:1 les options du selecteur "Je suis".
 *
 * - `chantierMoyen` : valeur moyenne d'un chantier residentiel, en euros (entier).
 * - `volumeBase`    : nombre de leads/mois en zone urbaine de reference (Namur).
 *
 * ⚠️ Estimations sectorielles à valider/ajuster.
 * Ce ne sont pas des chiffres mesures : ils alimentent le calculateur de la
 * landing en V1, en attendant des donnees reelles (counts + matching geo).
 */
const METIER_DATA: Record<
  string,
  { chantierMoyen: number; volumeBase: number }
> = {
  "toiture-facade-maconnerie": { chantierMoyen: 4500, volumeBase: 12 },
  "electricite-energie-securite": { chantierMoyen: 2500, volumeBase: 10 },
  "plomberie-chauffage-climatisation": { chantierMoyen: 2000, volumeBase: 14 },
  "chassis-portes-fermetures": { chantierMoyen: 3500, volumeBase: 8 },
  "cuisine-salle-de-bain": { chantierMoyen: 6000, volumeBase: 6 },
  "renovation-interieure": { chantierMoyen: 8000, volumeBase: 7 },
  "jardin-amenagement-exterieur": { chantierMoyen: 3000, volumeBase: 9 },
  "depannage-urgences": { chantierMoyen: 450, volumeBase: 22 },
  "demenagement-nettoyage-services": { chantierMoyen: 800, volumeBase: 11 },
};

/**
 * Coefficient multiplicateur applique au `volumeBase` selon la zone (densite de
 * la demande). Cle = `value` de la zone (cf. PRO_ZONES). Namur = 1.0 (reference).
 *
 * ⚠️ Estimations sectorielles à valider/ajuster. "la-louviere" n'etait pas dans le brief
 * initial → 0.95 propose (ville moyenne du Hainaut, entre Charleroi et Mons).
 * "default" = autre commune / zone plus rurale (fallback aussi pour toute zone
 * inconnue, via le `?? 0.8` de calculatePotential).
 */
const ZONE_MULTIPLIER: Record<string, number> = {
  bruxelles: 1.4,
  liege: 1.2,
  charleroi: 1.1,
  "la-louviere": 0.95,
  namur: 1.0,
  mons: 0.9,
  tournai: 0.8,
  default: 0.7,
};

// Zones proposees dans le selecteur "À" (ordre = ordre d'affichage). Doit rester
// aligne sur les cles de ZONE_MULTIPLIER ci-dessus.
export const PRO_ZONES = [
  { value: "bruxelles", label: "Bruxelles" },
  { value: "liege", label: "Liège" },
  { value: "namur", label: "Namur" },
  { value: "charleroi", label: "Charleroi" },
  { value: "mons", label: "Mons" },
  { value: "tournai", label: "Tournai" },
  { value: "la-louviere", label: "La Louvière" },
  { value: "default", label: "Autre commune" },
] as const;

export type Potential = {
  leadsMin: number;
  leadsMax: number;
  chantierMoyen: number;
};

/**
 * Estime le potentiel pour une famille de metier (slug d'univers) et une zone.
 * Retourne null si le metier est inconnu (-> etat vide cote UI). Fourchette
 * leads = volume ±30%, plancher a 1 (jamais 0).
 */
export function calculatePotential(
  metier: string,
  zone: string,
): Potential | null {
  const data = METIER_DATA[metier];
  if (!data) return null;

  const mult = ZONE_MULTIPLIER[zone] ?? 0.8;
  const volume = data.volumeBase * mult;

  return {
    leadsMin: Math.max(Math.round(volume * 0.7), 1),
    leadsMax: Math.round(volume * 1.3),
    chantierMoyen: data.chantierMoyen,
  };
}
