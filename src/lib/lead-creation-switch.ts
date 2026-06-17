import { prisma } from "@/lib/prisma";

/**
 * Kill switch « création de leads » (retours Kamel Sprint C). Permet à
 * l'admin de suspendre temporairement la création de nouvelles demandes
 * client (spam, incident) sans toucher au reste de la plateforme (pros +
 * admin continuent normalement).
 *
 * Stocké dans AppConfig (table clé-valeur), donc AUCUNE migration. Lu SANS
 * cache — contrairement à `getAppConfig` (cache 5 min) : un kill switch doit
 * se propager instantanément en cas de spam. La lecture est un simple
 * findUnique sur la PK, négligeable.
 *
 * Défaut = `true` (création autorisée) si la clé n'existe pas → pas de throw
 * (fail-open côté disponibilité : on ne bloque pas le service par simple
 * absence de config, contrairement au verrou de launch qui est fail-closed).
 */
export const LEAD_CREATION_ENABLED_KEY = "leadCreationEnabled";

export async function isLeadCreationEnabled(): Promise<boolean> {
  const row = await prisma.appConfig.findUnique({
    where: { key: LEAD_CREATION_ENABLED_KEY },
    select: { value: true },
  });
  if (!row) return true;
  return row.value === "true" || row.value === "1";
}

export async function setLeadCreationEnabled(
  enabled: boolean,
  adminUserId: string,
): Promise<void> {
  const value = enabled ? "true" : "false";
  await prisma.appConfig.upsert({
    where: { key: LEAD_CREATION_ENABLED_KEY },
    update: { value, updatedBy: adminUserId },
    create: {
      key: LEAD_CREATION_ENABLED_KEY,
      value,
      valueType: "bool",
      description:
        "Kill switch : création de nouvelles demandes client activée (true) ou suspendue (false).",
      updatedBy: adminUserId,
    },
  });
}
