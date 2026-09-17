"use server";

import { updateTag } from "next/cache";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { CATALOGUE_CACHE_TAG } from "@/server/queries/catalogue";
import {
  EXCLUSIVE_MAX_MULTIPLIER,
  updateCategoryPricingSchema,
} from "@/schemas/pricing";

export type UpdatePricingResult =
  | { success: true }
  | {
      success: false;
      code: "INVALID_INPUT" | "NOT_FOUND" | "INTERNAL";
      message: string;
    };

const toCents = (eur: number) => Math.round(eur * 100);

/** Garde-fou : standard <= exclusif <= standard × EXCLUSIVE_MAX_MULTIPLIER. */
function checkPair(sharedEur: number, exclusiveEur: number): string | null {
  if (exclusiveEur < sharedEur) {
    return "Le prix exclusif ne peut pas être inférieur au prix standard.";
  }
  if (exclusiveEur > sharedEur * EXCLUSIVE_MAX_MULTIPLIER) {
    return `Le prix exclusif ne peut pas dépasser ×${EXCLUSIVE_MAX_MULTIPLIER} le prix standard.`;
  }
  return null;
}

/**
 * Met à jour les prix absolus d'une catégorie et les overrides de ses
 * sous-catégories (null = hérite du défaut) en un seul batch atomique.
 * N'affecte que les futurs leads : les existants gardent leur snapshot de prix.
 */
export async function updateCategoryPricing(
  rawInput: unknown,
): Promise<UpdatePricingResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = updateCategoryPricingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const { categoryId, sharedEur, exclusiveEur, subCategories } = parsed.data;

  const catError = checkPair(sharedEur, exclusiveEur);
  if (catError) {
    return { success: false, code: "INVALID_INPUT", message: catError };
  }
  for (const sub of subCategories) {
    const hasShared = sub.sharedEur !== null;
    const hasExclusive = sub.exclusiveEur !== null;
    if (hasShared !== hasExclusive) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message:
          "Override sous-catégorie incomplet : renseignez les deux prix ou laissez vide pour hériter.",
      };
    }
    if (hasShared && hasExclusive) {
      const subError = checkPair(sub.sharedEur!, sub.exclusiveEur!);
      if (subError) {
        return { success: false, code: "INVALID_INPUT", message: subError };
      }
    }
  }

  try {
    return await withAuditLog<UpdatePricingResult>(
      {
        action: "PRICE_UPDATED",
        actorId: adminUserId,
        target: { type: "Category", id: categoryId },
        inputSummary: {
          categoryId,
          sharedCents: toCents(sharedEur),
          exclusiveCents: toCents(exclusiveEur),
          subCategoriesOverridden: subCategories.filter(
            (s) => s.sharedEur !== null,
          ).length,
        },
      },
      async (): Promise<UpdatePricingResult> => {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, subCategories: { select: { id: true } } },
        });
        if (!category) {
          return {
            success: false,
            code: "NOT_FOUND",
            message: "Catégorie introuvable.",
          };
        }
        // Refuse toute sous-catégorie d'une autre catégorie dans le payload.
        const ownIds = new Set(category.subCategories.map((s) => s.id));
        for (const sub of subCategories) {
          if (!ownIds.has(sub.id)) {
            return {
              success: false,
              code: "INVALID_INPUT",
              message: "Sous-catégorie hors de cette catégorie.",
            };
          }
        }

        await prisma.$transaction([
          prisma.category.update({
            where: { id: categoryId },
            data: {
              defaultSharedLeadPriceCents: toCents(sharedEur),
              defaultExclusiveLeadPriceCents: toCents(exclusiveEur),
            },
          }),
          ...subCategories.map((sub) =>
            prisma.subCategory.update({
              where: { id: sub.id },
              data: {
                sharedLeadPriceCents:
                  sub.sharedEur === null ? null : toCents(sub.sharedEur),
                exclusiveLeadPriceCents:
                  sub.exclusiveEur === null ? null : toCents(sub.exclusiveEur),
              },
            }),
          ),
        ]);

        // Invalide le catalogue en cache (affichage public). updateTag et non
        // revalidateTag : lecture immédiate de ses propres écritures depuis une
        // Server Action (Next 16). createLead lit les prix hors cache et
        // /admin/prix est force-dynamic.
        updateTag(CATALOGUE_CACHE_TAG);

        return { success: true };
      },
    );
  } catch (err) {
    console.error("[admin/updateCategoryPricing] failed", {
      adminUserId,
      categoryId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur interne. Réessayez.",
    };
  }
}
