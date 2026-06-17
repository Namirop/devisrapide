import { prisma } from "@/lib/prisma";

// Arbre catalogue pour l'éditeur de prix admin. Distinct de getCatalogueTree
// (caché + résout les fallbacks) : ici on veut les valeurs BRUTES, y compris
// les overrides null (= hérite du défaut catégorie), et pas de cache (l'admin
// doit voir l'état frais après chaque modification).

export type PricingSubCategory = {
  id: string;
  name: string;
  sharedLeadPriceCents: number | null;
  exclusiveLeadPriceCents: number | null;
};

export type PricingCategory = {
  id: string;
  name: string;
  defaultSharedLeadPriceCents: number;
  defaultExclusiveLeadPriceCents: number;
  subCategories: PricingSubCategory[];
};

export type PricingUniverse = {
  id: string;
  name: string;
  categories: PricingCategory[];
};

export async function getAdminPricingTree(): Promise<PricingUniverse[]> {
  const universes = await prisma.universe.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      categories: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          defaultSharedLeadPriceCents: true,
          defaultExclusiveLeadPriceCents: true,
          subCategories: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              name: true,
              sharedLeadPriceCents: true,
              exclusiveLeadPriceCents: true,
            },
          },
        },
      },
    },
  });

  return universes.filter((u) => u.categories.length > 0);
}
