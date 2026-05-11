import {
  Home,
  Wrench,
  Zap,
  Flame,
  Paintbrush,
  DoorOpen,
  BrickWall,
  Grid3x3,
  Siren,
  type LucideIcon,
} from "lucide-react";

// Single source of truth pour les 9 categories de la landing.
// Reutilisee par Hero (FormCard) + Categories (grille tableau) + dropdown nav.
// Note : Bricks n'existe pas dans lucide-react v1.14 → BrickWall (equivalent visuel).

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
  Icon: LucideIcon;
  urgent?: boolean;
}

export const CATEGORIES: readonly Category[] = [
  { id: "toiture", label: "Toiture", Icon: Home },
  { id: "plomberie", label: "Plomberie", Icon: Wrench },
  { id: "electricite", label: "Électricité", Icon: Zap },
  { id: "chauffage", label: "Chauffage", Icon: Flame },
  { id: "peinture", label: "Peinture", Icon: Paintbrush },
  { id: "menuiserie", label: "Menuiserie", Icon: DoorOpen },
  { id: "maconnerie", label: "Maçonnerie", Icon: BrickWall },
  { id: "carrelage", label: "Carrelage", Icon: Grid3x3 },
  { id: "sos", label: "SOS Dépannage", Icon: Siren, urgent: true },
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
