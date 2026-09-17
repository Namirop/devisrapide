// Résolution des codes postaux belges en mémoire depuis
// src/data/be-postal-codes.json : aucun appel réseau. Aucun filtre de région,
// le matching ne s'appuie que sur la distance au pro (rayon).

import postalData from "@/data/be-postal-codes.json";

type RawEntry = { commune: string; lat: number; lng: number };
const TABLE = postalData as Record<string, RawEntry>;

export type GeocodedPostalCode = {
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
};

export class GeocodeError extends Error {
  readonly kind: "NOT_FOUND";
  constructor(message: string) {
    super(message);
    this.name = "GeocodeError";
    this.kind = "NOT_FOUND";
  }
}

export function isGeocodeError(err: unknown): err is GeocodeError {
  return (
    err instanceof GeocodeError ||
    (err instanceof Error && err.name === "GeocodeError")
  );
}

/** Géocode un code postal belge ; `GeocodeError` si invalide ou inconnu. */
export async function geocodePostalCode(
  postalCode: string,
): Promise<GeocodedPostalCode> {
  if (!/^[1-9]\d{3}$/.test(postalCode)) {
    throw new GeocodeError("Code postal invalide");
  }
  const entry = TABLE[postalCode];
  if (!entry) {
    throw new GeocodeError("Code postal introuvable");
  }
  return {
    city: entry.commune,
    postalCode,
    latitude: entry.lat,
    longitude: entry.lng,
  };
}

/** Variante synchrone sans exception : résultat discriminé `valid`. */
export function validateAndResolvePostalCode(
  postalCode: string,
):
  | { valid: true; commune: string; lat: number; lng: number }
  | { valid: false } {
  if (!/^[1-9]\d{3}$/.test(postalCode)) return { valid: false };
  const entry = TABLE[postalCode];
  if (!entry) return { valid: false };
  return {
    valid: true,
    commune: entry.commune,
    lat: entry.lat,
    lng: entry.lng,
  };
}
