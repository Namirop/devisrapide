/**
 * Arbre catalogue pré-fetché côté serveur, passé au wizard client.
 * Prix résolus (fallback subCategory → category) pour éviter toute logique côté client.
 */

export type CatalogueSubCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sharedLeadPriceCents: number;
  exclusiveLeadPriceCents: number;
};

export type CatalogueCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  defaultSharedLeadPriceCents: number;
  defaultExclusiveLeadPriceCents: number;
  subCategories: CatalogueSubCategory[];
};

export type CatalogueUniverse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  categories: CatalogueCategory[];
};

export type CatalogueTree = CatalogueUniverse[];
