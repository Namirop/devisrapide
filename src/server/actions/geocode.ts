"use server";

import { geocodePostalCode, isGeocodeError } from "@/lib/geo/be-postal";

export type ValidatePostalCodeResult =
  | { valid: true; city: string; postalCode: string }
  | { valid: false; reason: "NOT_FOUND"; message: string };

/**
 * Vérifie en direct (étape 2 du formulaire) qu'un code postal belge figure
 * dans la table statique en mémoire, sans appel réseau. createLead refait la
 * résolution à la soumission pour figer lat/lng.
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
