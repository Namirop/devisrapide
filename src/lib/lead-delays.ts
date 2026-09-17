import { prisma } from "@/lib/prisma";

/**
 * Seuil « en souffrance » (alerte admin) : lead actif sans acheteur créé il
 * y a plus de N heures. Lu hors `getAppConfig`, qui lève si la clé manque :
 * le panel admin retombe sur 24 h au lieu de casser. Sans effet sur les crons.
 */
export const LEAD_SOUFFRANCE_HOURS_KEY = "LEAD_SOUFFRANCE_HOURS";
const DEFAULT_SOUFFRANCE_HOURS = 24;

export async function getLeadSouffranceHours(): Promise<number> {
  const row = await prisma.appConfig.findUnique({
    where: { key: LEAD_SOUFFRANCE_HOURS_KEY },
    select: { value: true },
  });
  if (!row) return DEFAULT_SOUFFRANCE_HOURS;
  const n = Number.parseInt(row.value, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_SOUFFRANCE_HOURS;
}

/** Lead sans acheteur dont `createdAt` précède cette date = en souffrance. */
export async function getSouffranceCutoff(): Promise<Date> {
  const hours = await getLeadSouffranceHours();
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
