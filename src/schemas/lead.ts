import { z } from "zod";

// Téléphone BE strict : accepte 0470123456, 0470 12 34 56, +32 470 12 34 56,
// 0032 470 12 34 56. Refuse les formats FR (+33, 06xxx).
const phoneRegex =
  /^(?:(?:\+|00)32[\s.-]?)?(?:0?[1-9])(?:[\s.-]?\d{2}){4}$/;

// Code postal BE : 4 chiffres, premier 1-9 (pas de leading zero).
const postalCodeRegex = /^[1-9]\d{3}$/;

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
    .regex(
      postalCodeRegex,
      "Le code postal doit contenir 4 chiffres (ex : 1000, 4000)",
    ),
  address: z.string().max(255, "Adresse trop longue"),
});

export const contactStepSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .regex(
      phoneRegex,
      "Le numéro doit être un numéro belge valide (ex : 0470 12 34 56 ou +32 470 12 34 56)",
    ),
});

export const createLeadSchema = universeStepSchema
  .merge(categoryStepSchema)
  .merge(subCategoryStepSchema)
  .merge(descriptionStepSchema)
  .merge(locationStepSchema)
  .merge(contactStepSchema);

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadWizardValues = CreateLeadInput;
