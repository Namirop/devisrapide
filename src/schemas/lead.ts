import { z } from "zod";

// Téléphone FR/BE : accepte 0612345678, +33612345678, 06 12 34 56 78,
// 06.12.34.56.78, +32 470 12 34 56, etc.
// Préfixes pays : +33 / 0033 (FR), +32 / 0032 (BE).
const phoneRegex =
  /^(?:(?:\+|00)(?:33|32)[\s.-]?)?(?:0?[1-9])(?:[\s.-]?\d{2}){4}$/;

const postalCodeRegex = /^\d{5}$/;

export const universeStepSchema = z.object({
  universeId: z.string().min(1, "Sélectionnez un univers"),
});

export const categoryStepSchema = z.object({
  categoryId: z.string().min(1, "Sélectionnez une catégorie"),
});

export const subCategoryStepSchema = z.object({
  subCategoryId: z.string().min(1, "Sélectionnez une sous-catégorie"),
});

export const descriptionStepSchema = z.object({
  description: z
    .string()
    .min(20, "Décrivez votre besoin en au moins 20 caractères")
    .max(2000, "2000 caractères maximum"),
  urgency: z.enum(["URGENT", "SOON", "PLANNED", "FLEXIBLE"]),
});

export const locationStepSchema = z.object({
  postalCode: z
    .string()
    .regex(postalCodeRegex, "Code postal invalide (5 chiffres)"),
  address: z.string().max(255, "Adresse trop longue"),
});

export const contactStepSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().regex(phoneRegex, "Numéro de téléphone invalide"),
});

export const createLeadSchema = universeStepSchema
  .merge(categoryStepSchema)
  .merge(subCategoryStepSchema)
  .merge(descriptionStepSchema)
  .merge(locationStepSchema)
  .merge(contactStepSchema);

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadWizardValues = CreateLeadInput;
