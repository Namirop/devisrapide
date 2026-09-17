import { z } from "zod";

import { passwordRules } from "@/schemas/password";

// Réinitialisation du mot de passe pro : demande du lien, puis nouveau mot de
// passe via le token.

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, "Email requis")
    .email("Email invalide")
    .transform((s) => s.toLowerCase().trim()),
  turnstileToken: z.string().min(1, "Vérification de sécurité requise"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token requis"),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RequestPasswordResetValues = z.infer<
  typeof requestPasswordResetSchema
>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
