import { z } from "zod";

// Règles du mot de passe pro, partagées par l'inscription et la
// réinitialisation pour qu'un reset ne puisse pas les contourner.
export const passwordRules = z
  .string()
  .min(8, "Au moins 8 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/\d/, "Au moins un chiffre");
