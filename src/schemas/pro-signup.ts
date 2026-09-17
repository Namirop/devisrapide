import { z } from "zod";

import { passwordRules } from "@/schemas/password";

// Schémas Zod de l'inscription pro (wizard en 4 étapes) : validés par étape
// côté client (form.trigger) et en entier par submitProRegistration.

// Même format que src/schemas/lead.ts : mobile belge à 10 chiffres, avec ou
// sans +32/0032. Limite connue : les fixes à 9 chiffres sont refusés.
const phoneBeRegex =
  /^(?:(?:\+|00)32[\s.-]?)?(?:0?[1-9])(?:[\s.-]?\d{2}){4}$/;
const postalBeRegex = /^[1-9]\d{3}$/;
const vatBeRegex = /^BE\d{10}$/;

// Étape 1 — Identité & accès compte
export const identityStepSchema = z
  .object({
    companyName: z.string().min(2, "Nom commercial requis").max(120),
    // Personne de contact, distincte du nom commercial : l'admin appelle
    // quelqu'un, pas une société. Stockée sur User.firstName/lastName.
    firstName: z
      .string()
      .trim()
      .min(2, "Prénom requis")
      .max(80, "80 caractères maximum"),
    lastName: z
      .string()
      .trim()
      .min(2, "Nom requis")
      .max(80, "80 caractères maximum"),
    vatNumber: z
      .string()
      .min(1, "Numéro de TVA requis")
      .regex(vatBeRegex, "Format attendu : BE0123456789"),
    email: z
      .string()
      .min(1, "Email requis")
      .email("Email invalide")
      .transform((s) => s.toLowerCase().trim()),
    phone: z
      .string()
      .min(1, "Téléphone requis")
      .regex(phoneBeRegex, "Numéro belge attendu (ex : 0470 12 34 56)"),
    postalCode: z
      .string()
      .regex(postalBeRegex, "Code postal BE 4 chiffres (ex : 1000)"),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Pré-contrôle d'unicité email + TVA (checkProSignupIdentity), mêmes règles
// que l'étape 1.
export const proSignupIdentityCheckSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  vatNumber: z.string().trim().regex(vatBeRegex),
});

// Étape 2 — Métiers (niveau Category, multi-select)
export const tradesStepSchema = z.object({
  categoryIds: z
    .array(z.string().min(1))
    .min(1, "Sélectionnez au moins un métier"),
});

// Étape 3 — Zone & rayon. -1 = toute la zone desservie, sans limite de rayon.
export const zoneStepSchema = z.object({
  zonePostalCode: z
    .string()
    .regex(postalBeRegex, "Code postal BE 4 chiffres"),
  radiusKm: z.union([z.literal(30), z.literal(60), z.literal(-1)]),
});

// Étape 4 — CGU et confidentialité obligatoires + jeton Turnstile.
// boolean().refine plutôt que literal(true) : le type reste compatible avec
// les valeurs du wizard (boolean) tout en exigeant true à l'exécution.
export const finalStepSchema = z.object({
  acceptCgu: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter les CGU",
  }),
  acceptPrivacy: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter la politique de confidentialité",
  }),
  turnstileToken: z.string().min(1, "Vérification de sécurité requise"),
});

export const proSignupSchema = identityStepSchema
  .and(tradesStepSchema)
  .and(zoneStepSchema)
  .and(finalStepSchema);

export type ProSignupValues = z.infer<typeof proSignupSchema>;

// Valeurs du formulaire React Hook Form : cases à cocher typées boolean pour
// accepter des defaultValues à false.
export type ProSignupWizardValues = {
  companyName: string;
  firstName: string;
  lastName: string;
  vatNumber: string;
  email: string;
  phone: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
  categoryIds: string[];
  zonePostalCode: string;
  radiusKm: 30 | 60 | -1;
  acceptCgu: boolean;
  acceptPrivacy: boolean;
  turnstileToken: string;
};
