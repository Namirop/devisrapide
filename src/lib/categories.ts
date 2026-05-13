import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  Door,
  Flame,
  House,
  Lightning,
  PaintBrushHousehold,
  Siren,
  SquaresFour,
  Wall,
  Wrench,
} from "@phosphor-icons/react";

// Single source of truth pour les 9 categories de la landing.
// Reutilisee par Hero (FormCard) + Categories (grille tableau) + dropdown nav.

export type CategoryId =
  | "toiture"
  | "plomberie"
  | "electricite"
  | "chauffage"
  | "peinture"
  | "menuiserie"
  | "maconnerie"
  | "carrelage"
  | "sos";

export interface Category {
  id: CategoryId;
  label: string;
  Icon: PhosphorIcon;
  urgent?: boolean;
  // Slug de l'univers Prisma cible et slug de la categorie Prisma cible.
  // Permet de generer le lien /demande?universe=X&category=Y depuis la
  // landing sans hardcoder dans chaque consommateur. Pour SOS, categorySlug
  // est null (univers wrapper, pas de prefiltrage category).
  universeSlug: string;
  categorySlug: string | null;
  // Sous-categorie a presectionner si la categorie cible groupe plusieurs
  // metiers landing (ex: tuile "Menuiserie" landing -> categorie Prisma
  // "menuiserie-interieure"). Optionnel.
  subCategorySlug?: string;
}

// Mapping landing -> nouveau catalogue 6 univers (cf. prisma/seed.ts).
// "Menuiserie" landing renvoie vers "Menuiserie interieure" (Renovation &
// Interieur), pas vers Chassis (Gros oeuvre).
export const CATEGORIES: readonly Category[] = [
  {
    id: "toiture",
    label: "Toiture",
    Icon: House,
    universeSlug: "gros-oeuvre-toiture",
    categorySlug: "toiture",
  },
  {
    id: "plomberie",
    label: "Plomberie",
    Icon: Wrench,
    universeSlug: "techniques-energie",
    categorySlug: "plomberie",
  },
  {
    id: "electricite",
    label: "Électricité",
    Icon: Lightning,
    universeSlug: "techniques-energie",
    categorySlug: "electricite",
  },
  {
    id: "chauffage",
    label: "Chauffage",
    Icon: Flame,
    universeSlug: "techniques-energie",
    categorySlug: "chauffage",
  },
  {
    id: "peinture",
    label: "Peinture",
    Icon: PaintBrushHousehold,
    universeSlug: "renovation-interieur",
    categorySlug: "peinture",
  },
  {
    id: "menuiserie",
    label: "Menuiserie",
    Icon: Door,
    universeSlug: "renovation-interieur",
    categorySlug: "menuiserie-interieure",
  },
  {
    id: "maconnerie",
    label: "Maçonnerie",
    Icon: Wall,
    universeSlug: "gros-oeuvre-toiture",
    categorySlug: "maconnerie",
  },
  {
    id: "carrelage",
    label: "Carrelage",
    Icon: SquaresFour,
    universeSlug: "renovation-interieur",
    categorySlug: "carrelage",
  },
  {
    id: "sos",
    label: "SOS Dépannage",
    Icon: Siren,
    urgent: true,
    universeSlug: "urgence-services",
    categorySlug: null,
  },
] as const;

// TODO Sprint 2+: derive from real Prisma counts. Hardcoded au launch.
export const CATEGORY_COUNTS: Record<CategoryId, string> = {
  toiture: "5 pros",
  plomberie: "4 pros",
  electricite: "4 pros",
  chauffage: "3 pros",
  peinture: "3 pros",
  menuiserie: "3 pros",
  maconnerie: "4 pros",
  carrelage: "3 pros",
  sos: "Dispo 24h/24",
};
