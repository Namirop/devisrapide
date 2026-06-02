// Single source of truth pour les 9 catégories de la landing.
// Réutilisée par Hero (FormCard) + Categories (grille tableau).
//
// Refonte client (juin 2026) : libellés regroupés + icônes illustrées
// (public/services/icons/*.png, fond transparent). Chaque tuile route vers
// son univers Prisma avec une catégorie de tête présélectionnée pour que deux
// tuiles ne pointent jamais vers la même destination (les univers regroupent
// plusieurs tuiles). Les autres métiers du regroupement restent accessibles
// via le Step2 du wizard.

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
  // Univers Prisma cible + catégorie de tête présélectionnée. Permet de
  // générer /demande?universe=X&category=Y depuis la landing. Pour le SOS,
  // categorySlug est null (univers wrapper, pas de préfiltrage).
  universeSlug: string;
  categorySlug: string | null;
}

const ICON_BASE = "/services/icons";

export const CATEGORIES: readonly Category[] = [
  {
    id: "toiture-facade-maconnerie",
    label: "Toiture, Façade & Maçonnerie",
    iconSrc: `${ICON_BASE}/toiture-facade-maconnerie.png`,
    universeSlug: "gros-oeuvre-toiture",
    categorySlug: "toiture",
  },
  {
    id: "electricite-energie-securite",
    label: "Électricité, Énergie & Sécurité",
    iconSrc: `${ICON_BASE}/electricite-energie-securite.png`,
    universeSlug: "techniques-energie",
    categorySlug: "electricite",
  },
  {
    id: "plomberie-chauffage-climatisation",
    label: "Plomberie, Chauffage & Climatisation",
    iconSrc: `${ICON_BASE}/plomberie-chauffage-climatisation.png`,
    universeSlug: "techniques-energie",
    categorySlug: "plomberie",
  },
  {
    id: "chassis-portes-fermetures",
    label: "Châssis, Portes & Fermetures",
    iconSrc: `${ICON_BASE}/chassis-portes-fermetures.png`,
    universeSlug: "gros-oeuvre-toiture",
    categorySlug: "chassis",
  },
  {
    id: "cuisine-salle-de-bain",
    label: "Cuisine & Salle de bain",
    iconSrc: `${ICON_BASE}/cuisine-salle-de-bain.png`,
    universeSlug: "renovation-interieur",
    categorySlug: "cuisine",
  },
  {
    id: "renovation-interieure",
    label: "Rénovation intérieure",
    iconSrc: `${ICON_BASE}/renovation-interieure.png`,
    universeSlug: "renovation-interieur",
    categorySlug: "renovation-interieure",
  },
  {
    id: "jardin-amenagement-exterieur",
    label: "Jardin & Aménagement extérieur",
    iconSrc: `${ICON_BASE}/jardin-amenagement-exterieur.png`,
    universeSlug: "exterieur-amenagement",
    categorySlug: "jardin",
  },
  {
    id: "depannage-urgences",
    label: "Dépannage & Urgences",
    iconSrc: `${ICON_BASE}/depannage-urgences.png`,
    urgent: true,
    universeSlug: "urgence-services",
    categorySlug: null,
  },
  {
    id: "demenagement-nettoyage-services",
    label: "Déménagement, Nettoyage & Services",
    iconSrc: `${ICON_BASE}/demenagement-nettoyage-services.png`,
    universeSlug: "urgence-services",
    categorySlug: "nettoyage",
  },
] as const;
