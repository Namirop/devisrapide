import { z } from "zod";

// ----------------------------------------------------------------------------
// Schemas Zod pour l'inscription pro (wizard 4 etapes).
// Validation cote serveur dans submitProRegistration + validation par etape
// cote client via form.trigger(STEP_FIELDS[step]).
// ----------------------------------------------------------------------------

// BE strict (cf. lead.ts) — accepte 0470 12 34 56 / +32 470... / 0032...
const phoneBeRegex =
  /^(?:(?:\+|00)32[\s.-]?)?(?:0?[1-9])(?:[\s.-]?\d{2}){4}$/;
const postalBeRegex = /^[1-9]\d{3}$/;
const vatBeRegex = /^BE\d{10}$/;
const passwordRules = z
  .string()
  .min(8, "Au moins 8 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/\d/, "Au moins un chiffre");

// Étape 1 — Identité & accès compte
export const identityStepSchema = z
  .object({
    companyName: z.string().min(2, "Nom commercial requis").max(120),
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

// Étape 2 — Métiers (niveau Category, multi-select)
export const tradesStepSchema = z.object({
  categoryIds: z
    .array(z.string().min(1))
    .min(1, "Sélectionnez au moins un métier"),
});

// Étape 3 — Zone & rayon. -1 = OPEN (toute la zone V1).
export const zoneStepSchema = z.object({
  zonePostalCode: z
    .string()
    .regex(postalBeRegex, "Code postal BE 4 chiffres"),
  radiusKm: z.union([z.literal(30), z.literal(60), z.literal(-1)]),
});

// Étape 4 — Validation finale (CGU + confidentialité obligatoires +
// Turnstile token anti-bot).
// boolean().refine plutot que literal(true) : permet a zodResolver de
// matcher avec le type wizard (boolean), tout en garantissant runtime
// que la valeur est true.
export const finalStepSchema = z.object({
  acceptCgu: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter les CGU",
  }),
  acceptPrivacy: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter la politique de confidentialité",
  }),
  turnstileToken: z.string().min(1, "Vérification de sécurité requise"),
});

// Schema complet pour le submit final.
export const proSignupSchema = identityStepSchema
  .and(tradesStepSchema)
  .and(zoneStepSchema)
  .and(finalStepSchema);

export type ProSignupValues = z.infer<typeof proSignupSchema>;

// Wizard form values (avec confirmPassword + booleens cocher uncocher).
// Identique a ProSignupValues mais avec types React-Hook-Form friendly
// (acceptCgu/acceptPrivacy = boolean au lieu de literal(true) sinon RHF
// rage avec les defaultValues).
export type ProSignupWizardValues = {
  companyName: string;
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
