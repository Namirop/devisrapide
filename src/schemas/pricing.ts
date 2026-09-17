import { z } from "zod";

/**
 * Prix saisis en euros, convertis en centimes par l'action. Le garde-fou
 * standard ≤ exclusif ≤ standard × 10 est vérifié dans l'action, pour un
 * message d'erreur clair.
 */
const euros = z.number().finite().positive().max(100000, "Prix trop élevé.");

const subCategoryPricingSchema = z.object({
  id: z.string().min(1),
  // Deux null = hérite du prix catégorie ; sinon les deux sont requis
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

/** Partagé client/serveur : exclusif entre ×1 et ×10 du prix standard. */
export const EXCLUSIVE_MAX_MULTIPLIER = 10;
/** Pré-remplissage du prix exclusif dans l'UI. */
export const EXCLUSIVE_SUGGESTION_MULTIPLIER = 2.5;
