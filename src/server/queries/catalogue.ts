import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import type {
  CatalogueCategory,
  CatalogueSubCategory,
  CatalogueTree,
  CatalogueUniverse,
} from "@/types/catalogue";

// À invalider (updateTag) après toute écriture sur Universe, Category ou
// SubCategory.
export const CATALOGUE_CACHE_TAG = "catalogue";

/**
 * Arbre catalogue actif (univers → catégories → sous-catégories), prix des
 * sous-catégories résolus sur le défaut de leur catégorie. Données
 * quasi statiques : mises en cache, invalidées par tag, filet de 1 h.
 */
export const getCatalogueTree = unstable_cache(
  fetchCatalogueTree,
  ["catalogue-tree"],
  { tags: [CATALOGUE_CACHE_TAG], revalidate: 3600 },
);

async function fetchCatalogueTree(): Promise<CatalogueTree> {
  const universes = await prisma.universe.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          subCategories: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      },
    },
  });

  return universes.map<CatalogueUniverse>((u) => ({
    id: u.id,
    name: u.name,
    slug: u.slug,
    description: u.description,
    iconName: u.iconName,
    categories: u.categories.map<CatalogueCategory>((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      defaultSharedLeadPriceCents: c.defaultSharedLeadPriceCents,
      defaultExclusiveLeadPriceCents: c.defaultExclusiveLeadPriceCents,
      subCategories: c.subCategories.map<CatalogueSubCategory>((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        sharedLeadPriceCents:
          s.sharedLeadPriceCents ?? c.defaultSharedLeadPriceCents,
        exclusiveLeadPriceCents:
          s.exclusiveLeadPriceCents ?? c.defaultExclusiveLeadPriceCents,
      })),
    })),
  }));
}
