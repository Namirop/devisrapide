import { prisma } from "@/lib/prisma";

/**
 * Kill switch admin : suspend la création de demandes client (spam, panne)
 * sans affecter pros ni admin. Lu sans le cache de `getAppConfig` (5 min)
 * pour s'appliquer immédiatement. Clé absente = création autorisée
 * (fail-open : une config manquante ne doit pas couper le service).
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
