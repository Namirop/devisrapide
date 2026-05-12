"use server";

import { geocodePostalCode, isGeocodeError } from "@/lib/geo/be-postal";

export type ValidatePostalCodeResult =
  | { valid: true; city: string; postalCode: string }
  | { valid: false; reason: "NOT_FOUND"; message: string };

/**
 * Vérifie en direct (étape 5 du wizard) qu'un code postal BE est connu de la
 * table statique. Léger : pas de fetch réseau, lookup O(1) en mémoire.
 * createLead refait la résolution à la soumission finale (snapshot lat/lng).
 */
export async function validatePostalCode(
  postalCode: unknown,
): Promise<ValidatePostalCodeResult> {
  if (typeof postalCode !== "string" || !/^[1-9]\d{3}$/.test(postalCode)) {
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
      return {
        valid: false,
        reason: "NOT_FOUND",
        message: "Code postal introuvable",
      };
    }
    console.error("[validatePostalCode] unexpected", err);
    return {
      valid: false,
      reason: "NOT_FOUND",
      message: "Erreur inattendue, réessayez dans un instant.",
    };
  }
}
