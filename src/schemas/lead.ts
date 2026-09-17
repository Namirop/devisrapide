import { z } from "zod";

// Format mobile belge à 10 chiffres (0470 12 34 56), avec ou sans +32/0032,
// séparateurs espace, point ou tiret. Refuse les indicatifs étrangers (+33…).
// Limite connue : les fixes belges à 9 chiffres (02 123 45 67) sont refusés,
// et un numéro 06… saisi sans indicatif est accepté.
const phoneRegex = /^(?:(?:\+|00)32[\s.-]?)?(?:0?[1-9])(?:[\s.-]?\d{2}){4}$/;

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

// Présence du jeton Turnstile seulement : sa validité est vérifiée côté
// serveur par createLead (verifyTurnstileToken), avant le rate limit.
export const turnstileTokenSchema = z.object({
  turnstileToken: z.string().min(1, "Vérification de sécurité requise"),
});

export const createLeadSchema = universeStepSchema
  .merge(categoryStepSchema)
  .merge(subCategoryStepSchema)
  .merge(descriptionStepSchema)
  .merge(locationStepSchema)
  .merge(contactStepSchema)
  .merge(turnstileTokenSchema);

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadWizardValues = CreateLeadInput;
