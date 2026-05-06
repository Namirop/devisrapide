// API Base Adresse Nationale (data.gouv.fr) — gratuite, publique, pas de quota strict.
// https://adresse.data.gouv.fr/api-doc/adresse

const BAN_BASE_URL = "https://api-adresse.data.gouv.fr/search/";

// Seuil minimal de pertinence renvoyé par BAN. En-dessous, on considère le
// match trop faible pour faire confiance (BAN peut "rapprocher" un code
// inexistant d'une adresse pas liée).
const MIN_SCORE = 0.5;

export type GeocodedPostalCode = {
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
};

/**
 * Erreur de géocodage côté BAN. Distincte des erreurs internes pour que la
 * Server Action puisse remonter un message inline sous le champ "code postal".
 *
 * `kind` permet de différencier "code introuvable / score trop bas" (faute du
 * client) de "API down / réponse illisible" (transient, à retry).
 */
export class GeocodeError extends Error {
  readonly kind: "NOT_FOUND" | "UPSTREAM";
  constructor(
    kind: "NOT_FOUND" | "UPSTREAM",
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GeocodeError";
    this.kind = kind;
  }
}

export function isGeocodeError(err: unknown): err is GeocodeError {
  // Double check : `instanceof` peut rater si le module est dupliqué dans le
  // bundle (Next.js dev/turbopack), donc on accepte aussi un match par nom.
  return (
    err instanceof GeocodeError ||
    (err instanceof Error && err.name === "GeocodeError")
  );
}

type BanFeature = {
  geometry?: { coordinates?: unknown };
  properties?: {
    city?: unknown;
    citycode?: unknown;
    postcode?: unknown;
    type?: unknown;
    score?: unknown;
  };
};

type BanResponse = {
  features?: BanFeature[];
};

/**
 * Géocode un code postal FR via l'API BAN.
 *
 * Multi-communes : un code postal peut couvrir plusieurs communes (ex: 13100 = Aix + alentours).
 * On retourne la PREMIÈRE commune renvoyée par BAN (tri pertinence). C'est volontaire au S1.
 */
export async function geocodePostalCode(
  postalCode: string,
): Promise<GeocodedPostalCode> {
  if (!/^\d{5}$/.test(postalCode)) {
    throw new GeocodeError("NOT_FOUND", "Code postal introuvable");
  }

  const url = `${BAN_BASE_URL}?q=${encodeURIComponent(postalCode)}&type=municipality&limit=1`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (err) {
    throw new GeocodeError("UPSTREAM", "Service de géocodage indisponible", err);
  }
  if (!res.ok) {
    throw new GeocodeError(
      "UPSTREAM",
      `Service de géocodage indisponible (HTTP ${res.status})`,
    );
  }

  let data: BanResponse;
  try {
    data = (await res.json()) as BanResponse;
  } catch (err) {
    throw new GeocodeError("UPSTREAM", "Réponse de géocodage illisible", err);
  }

  const feature = Array.isArray(data.features) ? data.features[0] : undefined;
  if (!feature) {
    throw new GeocodeError("NOT_FOUND", "Code postal introuvable");
  }

  const score = feature.properties?.score;
  if (typeof score !== "number" || score < MIN_SCORE) {
    throw new GeocodeError("NOT_FOUND", "Code postal introuvable");
  }

  const coords = feature.geometry?.coordinates;
  if (
    !Array.isArray(coords) ||
    coords.length !== 2 ||
    typeof coords[0] !== "number" ||
    typeof coords[1] !== "number" ||
    !Number.isFinite(coords[0]) ||
    !Number.isFinite(coords[1])
  ) {
    throw new GeocodeError("NOT_FOUND", "Code postal introuvable");
  }
  // BAN renvoie [lng, lat] (GeoJSON), on inverse.
  const [longitude, latitude] = coords as [number, number];

  const city = feature.properties?.city;
  if (typeof city !== "string" || city.length === 0) {
    throw new GeocodeError("NOT_FOUND", "Code postal introuvable");
  }

  const banPostcode = feature.properties?.postcode;
  return {
    city,
    postalCode:
      typeof banPostcode === "string" && /^\d{5}$/.test(banPostcode)
        ? banPostcode
        : postalCode,
    latitude,
    longitude,
  };
}
