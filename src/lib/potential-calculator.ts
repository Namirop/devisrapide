// Calculateur de la section ProPotential (/pros) : fourchette de leads/mois et
// valeur moyenne d'un chantier, par univers du catalogue et par zone.
// Limite connue : estimations sectorielles, pas des mesures issues de la base.

/**
 * Clé = slug d'univers (cf. prisma/seed.ts). `chantierMoyen` en euros,
 * `volumeBase` = leads/mois dans la zone de référence (Namur).
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
 * Multiplicateur de `volumeBase` selon la densité de la zone (clé = `value`
 * de PRO_ZONES). `default` = « Autre commune » ; une clé inconnue retombe sur
 * 0.8 (cf. calculatePotential), pas sur `default`.
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

// Ordre d'affichage du sélecteur ; valeurs alignées sur ZONE_MULTIPLIER.
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

/** Fourchette = volume ±30 %, plancher à 1. `null` si l'univers est inconnu. */
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
