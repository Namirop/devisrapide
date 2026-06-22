import { prisma } from "@/lib/prisma";

/**
 * Seuil « en souffrance » : un lead actif (PENDING_MATCH /
 * ASSIGNED) sans acheteur, créé il y a plus de N heures, est considéré en
 * souffrance (alerte admin — badge rouge, onglet dédié). Basé sur createdAt.
 *
 * Stocké dans AppConfig (`LEAD_SOUFFRANCE_HOURS`), tunable sans redéploiement.
 * Lu SANS le cache de `getAppConfig` (qui throw si la clé manque) : findUnique
 * direct + défaut robuste à 24h → ne casse jamais le panel admin si la clé est
 * absente. (Le cron n'utilise pas ce seuil ; aucun effet de bord planificateur.)
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

/**
 * Timestamp seuil : un lead créé AVANT ce moment (et sans acheteur) est en
 * souffrance. À comparer à `Lead.createdAt`.
 */
export async function getSouffranceCutoff(): Promise<Date> {
  const hours = await getLeadSouffranceHours();
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
