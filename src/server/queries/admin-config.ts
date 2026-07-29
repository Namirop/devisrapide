import { prisma } from "@/lib/prisma";

export const LEAD_SETTINGS_KEYS = {
  souffrance: "LEAD_SOUFFRANCE_HOURS",
  timeout: "LEAD_GLOBAL_TIMEOUT_HOURS",
  maxAcceptances: "SHARED_LEAD_MAX_ACCEPTANCES",
  paliers: "RADIUS_PALIERS_KM",
  delays: "ZONE_EXPANSION_DELAYS_MIN",
} as const;

export type LeadSettings = {
  souffranceHours: number;
  globalTimeoutHours: number;
  maxAcceptances: number;
  radiusInitialKm: number;
  radiusExpandedKm: number;
  expansionDelay1Min: number;
  expansionDelay2Min: number;
};

/** Valeurs de repli si une clé manque ou est illisible — alignées sur le seed. */
const FALLBACK: LeadSettings = {
  souffranceHours: 24,
  globalTimeoutHours: 72,
  maxAcceptances: 3,
  radiusInitialKm: 30,
  radiusExpandedKm: 60,
  expansionDelay1Min: 120,
  expansionDelay2Min: 240,
};

function parseInt10(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseNumberArray(raw: string | undefined): number[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const nums = parsed.map((v) => Number(v));
    return nums.every((n) => Number.isFinite(n)) ? nums : null;
  } catch {
    return null;
  }
}

/**
 * Lit les réglages de cycle de vie des leads pour le formulaire admin.
 *
 * Lecture directe (pas `getAppConfig`) pour deux raisons : ce dernier
 * cache 5 min — le formulaire afficherait une valeur périmée juste après
 * un enregistrement — et il throw si une clé manque, ce qui casserait la
 * page de configuration entière. Ici chaque valeur illisible retombe
 * silencieusement sur son défaut.
 */
export async function getLeadSettings(): Promise<LeadSettings> {
  const rows = await prisma.appConfig.findMany({
    where: { key: { in: Object.values(LEAD_SETTINGS_KEYS) } },
    select: { key: true, value: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const paliers = parseNumberArray(byKey.get(LEAD_SETTINGS_KEYS.paliers));
  const delays = parseNumberArray(byKey.get(LEAD_SETTINGS_KEYS.delays));

  return {
    souffranceHours: parseInt10(
      byKey.get(LEAD_SETTINGS_KEYS.souffrance),
      FALLBACK.souffranceHours,
    ),
    globalTimeoutHours: parseInt10(
      byKey.get(LEAD_SETTINGS_KEYS.timeout),
      FALLBACK.globalTimeoutHours,
    ),
    maxAcceptances: parseInt10(
      byKey.get(LEAD_SETTINGS_KEYS.maxAcceptances),
      FALLBACK.maxAcceptances,
    ),
    radiusInitialKm: paliers?.[0] ?? FALLBACK.radiusInitialKm,
    radiusExpandedKm: paliers?.[1] ?? FALLBACK.radiusExpandedKm,
    expansionDelay1Min: delays?.[0] ?? FALLBACK.expansionDelay1Min,
    expansionDelay2Min: delays?.[1] ?? FALLBACK.expansionDelay2Min,
  };
}
