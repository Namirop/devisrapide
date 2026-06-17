import { z } from "zod";

/**
 * Prix saisis en EUROS côté UI (max 2 décimales), convertis en centimes
 * côté action. Garde-fous métier (exclusif >= standard et <= standard ×10)
 * vérifiés dans l'action, pas ici, pour renvoyer un message clair.
 */
const euros = z.number().finite().positive().max(100000, "Prix trop élevé.");

const subCategoryPricingSchema = z.object({
  id: z.string().min(1),
  // null + null = hériter du défaut catégorie. Sinon les deux requis
  // (vérifié dans l'action).
  sharedEur: euros.nullable(),
  exclusiveEur: euros.nullable(),
});

export const updateCategoryPricingSchema = z.object({
  categoryId: z.string().min(1),
  sharedEur: euros,
  exclusiveEur: euros,
  subCategories: z.array(subCategoryPricingSchema).max(200),
});

export type UpdateCategoryPricingInput = z.infer<
  typeof updateCategoryPricingSchema
>;

/** Garde-fou métier partagé client/serveur : exclusif entre ×1 et ×10. */
export const EXCLUSIVE_MAX_MULTIPLIER = 10;
/** Multiplicateur de suggestion pour pré-remplir le prix exclusif dans l'UI. */
export const EXCLUSIVE_SUGGESTION_MULTIPLIER = 2.5;
