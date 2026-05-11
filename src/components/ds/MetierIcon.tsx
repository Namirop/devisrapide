import {
  Home,
  Wrench,
  Zap,
  Flame,
  Paintbrush,
  Hammer,
  Layers,
  Grid3x3,
  Siren,
  type LucideIcon,
} from "lucide-react";

export type MetierSlug =
  | "toiture"
  | "plomberie"
  | "electricite"
  | "chauffage"
  | "peinture"
  | "menuiserie"
  | "maconnerie"
  | "carrelage"
  | "sos-depannage";

const ICONS: Record<MetierSlug, LucideIcon> = {
  toiture: Home,
  plomberie: Wrench,
  electricite: Zap,
  chauffage: Flame,
  peinture: Paintbrush,
  menuiserie: Hammer,
  maconnerie: Layers,
  carrelage: Grid3x3,
  "sos-depannage": Siren,
};

export function getMetierIcon(slug: MetierSlug): LucideIcon {
  return ICONS[slug];
}
