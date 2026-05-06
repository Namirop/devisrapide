// API Base Adresse Nationale (data.gouv.fr) — gratuite, publique, pas de quota strict.
// https://adresse.data.gouv.fr/api-doc/adresse

const BAN_BASE_URL = "https://api-adresse.data.gouv.fr/search/";

export type GeocodedPostalCode = {
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
};

export class BanGeocodingError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "BanGeocodingError";
  }
}

type BanFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    city?: string;
    citycode?: string;
    postcode?: string;
    type?: string;
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
 * Si Kamel veut faire choisir le client, on l'ajoutera plus tard.
 */
export async function geocodePostalCode(
  postalCode: string,
): Promise<GeocodedPostalCode> {
  if (!/^\d{5}$/.test(postalCode)) {
    throw new BanGeocodingError(`Code postal invalide: ${postalCode}`);
  }

  const url = `${BAN_BASE_URL}?q=${encodeURIComponent(postalCode)}&type=municipality&limit=1`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      // pas de cache : BAN est rapide, et les données ne changent jamais à cette échelle
    });
  } catch (err) {
    throw new BanGeocodingError("Impossible de joindre l'API BAN", err);
  }

  if (!res.ok) {
    throw new BanGeocodingError(`BAN HTTP ${res.status}`);
  }

  let data: BanResponse;
  try {
    data = (await res.json()) as BanResponse;
  } catch (err) {
    throw new BanGeocodingError("Réponse BAN illisible", err);
  }

  const feature = data.features?.[0];
  const coords = feature?.geometry?.coordinates;
  const props = feature?.properties;

  if (!feature || !coords || !props?.city) {
    throw new BanGeocodingError(`Aucune commune trouvée pour ${postalCode}`);
  }

  // BAN renvoie [lng, lat] (GeoJSON), on inverse.
  const [longitude, latitude] = coords;

  return {
    city: props.city,
    postalCode: props.postcode ?? postalCode,
    latitude,
    longitude,
  };
}
