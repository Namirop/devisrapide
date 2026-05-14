import { z } from "zod";

// Regle de force minimum pour les mdp admin : 10 chars + 1 maj + 1 min +
// 1 chiffre. Pas de symbole obligatoire (evite frustrations clavier
// belge), mais autorise. Aligne sur les recommandations NIST 2024
// (longueur > complexite excessive).
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

export const updateAdminEmailSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newEmail: z
      .string()
      .email("Email invalide")
      .transform((s) => s.toLowerCase().trim()),
    confirmEmail: z
      .string()
      .email("Email invalide")
      .transform((s) => s.toLowerCase().trim()),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    path: ["confirmEmail"],
    message: "Les deux emails ne correspondent pas",
  });

export type UpdateAdminEmailInput = z.infer<typeof updateAdminEmailSchema>;

export const updateAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .regex(
        STRONG_PASSWORD_REGEX,
        "Au moins 10 caractères, 1 majuscule, 1 minuscule et 1 chiffre",
      ),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas",
  });

export type UpdateAdminPasswordInput = z.infer<
  typeof updateAdminPasswordSchema
>;
