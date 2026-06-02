// Single source of truth pour les 9 tuiles de la landing (Hero FormCard +
// grille Categories). Depuis la refonte catalogue V1, chaque tuile correspond
// 1:1 à un univers Prisma (même slug) → on route au niveau univers, le wizard
// prend le relais au Step 2 (choix de la catégorie). Icônes illustrées à fond
// transparent dans public/services/icons/.

export type CategoryId =
  | "toiture-facade-maconnerie"
  | "electricite-energie-securite"
  | "plomberie-chauffage-climatisation"
  | "chassis-portes-fermetures"
  | "cuisine-salle-de-bain"
  | "renovation-interieure"
  | "jardin-amenagement-exterieur"
  | "depannage-urgences"
  | "demenagement-nettoyage-services";

export interface Category {
  id: CategoryId;
  label: string;
  // Icône illustrée à fond transparent (servie depuis /public).
  iconSrc: string;
  urgent?: boolean;
  // Univers Prisma cible (slug identique à l'id). Génère /demande?universe=X.
  universeSlug: string;
}

const ICON_BASE = "/services/icons";

export const CATEGORIES: readonly Category[] = [
  {
    id: "toiture-facade-maconnerie",
    label: "Toiture, Façade & Maçonnerie",
    iconSrc: `${ICON_BASE}/toiture-facade-maconnerie.png`,
    universeSlug: "toiture-facade-maconnerie",
  },
  {
    id: "electricite-energie-securite",
    label: "Électricité, Énergie & Sécurité",
    iconSrc: `${ICON_BASE}/electricite-energie-securite.png`,
    universeSlug: "electricite-energie-securite",
  },
  {
    id: "plomberie-chauffage-climatisation",
    label: "Plomberie, Chauffage & Climatisation",
    iconSrc: `${ICON_BASE}/plomberie-chauffage-climatisation.png`,
    universeSlug: "plomberie-chauffage-climatisation",
  },
  {
    id: "chassis-portes-fermetures",
    label: "Châssis, Portes & Fermetures",
    iconSrc: `${ICON_BASE}/chassis-portes-fermetures.png`,
    universeSlug: "chassis-portes-fermetures",
  },
  {
    id: "cuisine-salle-de-bain",
    label: "Cuisine & Salle de bain",
    iconSrc: `${ICON_BASE}/cuisine-salle-de-bain.png`,
    universeSlug: "cuisine-salle-de-bain",
  },
  {
    id: "renovation-interieure",
    label: "Rénovation intérieure",
    iconSrc: `${ICON_BASE}/renovation-interieure.png`,
    universeSlug: "renovation-interieure",
  },
  {
    id: "jardin-amenagement-exterieur",
    label: "Jardin & Aménagement extérieur",
    iconSrc: `${ICON_BASE}/jardin-amenagement-exterieur.png`,
    universeSlug: "jardin-amenagement-exterieur",
  },
  {
    id: "depannage-urgences",
    label: "Dépannage & Urgences",
    iconSrc: `${ICON_BASE}/depannage-urgences.png`,
    urgent: true,
    universeSlug: "depannage-urgences",
  },
  {
    id: "demenagement-nettoyage-services",
    label: "Déménagement, Nettoyage & Services",
    iconSrc: `${ICON_BASE}/demenagement-nettoyage-services.png`,
    universeSlug: "demenagement-nettoyage-services",
  },
] as const;
