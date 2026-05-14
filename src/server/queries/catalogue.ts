import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import type {
  CatalogueCategory,
  CatalogueSubCategory,
  CatalogueTree,
  CatalogueUniverse,
} from "@/types/catalogue";

// Tag de cache pour invalider l'arbre catalogue. A appeler via
// `revalidateTag(CATALOGUE_CACHE_TAG)` dans toute action admin qui
// cree/modifie/supprime un Universe / Category / SubCategory
// (admin catalogue editor : Sprint 5+).
export const CATALOGUE_CACHE_TAG = "catalogue";

/**
 * Charge l'arbre catalogue complet (univers → catégories → sous-catégories)
 * uniquement pour les entrées actives, ordonnées par displayOrder.
 *
 * Prix sous-catégorie résolu avec fallback sur le prix catégorie.
 * Au S1 (~50 sous-catégories au seed), un seul fetch monolithique est OK.
 *
 * Cache : `unstable_cache` avec tag "catalogue". Revalidation manuelle
 * via `revalidateTag(CATALOGUE_CACHE_TAG)` + safety net 1h. Elimine le
 * round-trip Prisma sur /demande, /pros, etc. (donnees quasi-statiques).
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
