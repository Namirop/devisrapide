// Lookup code postal BE en O(1) depuis le JSON statique src/data/be-postal-codes.json.
// Remplace l'ancien BAN (FR) — pas de fetch reseau, tout en memoire.
//
// Couverture : tous les codes postaux BE (1000-9999). Le filtrage zone V1
// (Wallonie + Bruxelles francophone) se fait cote matching, pas ici.

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

/**
 * Geocode un code postal BE depuis le JSON statique.
 *
 * Le module conserve la signature publique de l'ancien `ban.ts` (FR) pour
 * eviter des modifications en cascade dans les Server Actions. Le kind
 * "UPSTREAM" n'existe plus puisque pas de fetch reseau.
 */
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

/**
 * Variante non-async pour les validations purement synchrones (ex : check
 * en direct dans une UI server component). Garde l'API async sur
 * `geocodePostalCode` pour minimiser la diff sur les Server Actions
 * existantes.
 */
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
