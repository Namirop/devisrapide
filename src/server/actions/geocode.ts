"use server";

import { geocodePostalCode, isGeocodeError } from "@/lib/geo/ban";

export type ValidatePostalCodeResult =
  | { valid: true; city: string; postalCode: string }
  | { valid: false; reason: "NOT_FOUND" | "UPSTREAM"; message: string };

/**
 * Vérifie en direct (étape 5 du wizard) qu'un code postal est connu de BAN
 * avant de laisser passer à l'étape suivante. Léger volontairement : pas de
 * rate limit ni de DB hit, juste un fetch BAN. createLead refait la requête
 * à la soumission finale (snapshot lat/lng à ce moment-là).
 */
export async function validatePostalCode(
  postalCode: unknown,
): Promise<ValidatePostalCodeResult> {
  if (typeof postalCode !== "string" || !/^\d{5}$/.test(postalCode)) {
    return {
      valid: false,
      reason: "NOT_FOUND",
      message: "Code postal invalide",
    };
  }
  try {
    const geo = await geocodePostalCode(postalCode);
    return { valid: true, city: geo.city, postalCode: geo.postalCode };
  } catch (err) {
    if (isGeocodeError(err)) {
      return err.kind === "NOT_FOUND"
        ? {
            valid: false,
            reason: "NOT_FOUND",
            message: "Code postal introuvable",
          }
        : {
            valid: false,
            reason: "UPSTREAM",
            message:
              "Service de géocodage indisponible, réessayez dans un instant.",
          };
    }
    console.error("[validatePostalCode] unexpected", err);
    return {
      valid: false,
      reason: "UPSTREAM",
      message: "Erreur inattendue, réessayez dans un instant.",
    };
  }
}
