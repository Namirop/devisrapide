import { z } from "zod";

// Regles de force du mot de passe, partagees entre l'inscription pro
// (identityStepSchema) et la reinitialisation (resetPasswordSchema) :
// 8+ caracteres, au moins une majuscule et un chiffre. Source unique pour
// garantir qu'un mot de passe choisi via reset respecte les memes regles
// qu'a l'inscription.
export const passwordRules = z
  .string()
  .min(8, "Au moins 8 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/\d/, "Au moins un chiffre");
