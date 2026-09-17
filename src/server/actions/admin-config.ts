"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { invalidateAppConfigCache } from "@/lib/config";
import {
  LEAD_CREATION_ENABLED_KEY,
  setLeadCreationEnabled,
} from "@/lib/lead-creation-switch";
import { prisma } from "@/lib/prisma";
import {
  leadSettingsSchema,
  toggleLeadCreationSchema,
} from "@/schemas/admin-config";
import { LEAD_SETTINGS_KEYS } from "@/server/queries/admin-config";

export type ToggleLeadCreationResult =
  | { success: true; enabled: boolean }
  | {
      success: false;
      code:
        "INVALID_INPUT" | "WRONG_PASSWORD" | "PASSWORD_NOT_SET" | "INTERNAL";
      message: string;
    };

/**
 * Kill switch de la création de demandes client. Exige le mot de passe de
 * l'admin courant (userId issu de la session, jamais de l'input) et trace
 * l'action dans l'AuditLog.
 */
export async function toggleLeadCreation(
  raw: unknown,
): Promise<ToggleLeadCreationResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = toggleLeadCreationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const { enabled, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return {
      success: false,
      code: "PASSWORD_NOT_SET",
      message: "Aucun mot de passe défini sur ce compte.",
    };
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return {
      success: false,
      code: "WRONG_PASSWORD",
      message: "Mot de passe incorrect.",
    };
  }

  try {
    await withAuditLog<void>(
      {
        action: "LEAD_CREATION_TOGGLED",
        actorId: adminUserId,
        target: { type: "AppConfig", id: LEAD_CREATION_ENABLED_KEY },
        inputSummary: { enabled },
      },
      async () => {
        await setLeadCreationEnabled(enabled, adminUserId);
      },
    );
  } catch {
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur interne. Réessayez.",
    };
  }

  // Bannière admin (layout) + page /demande doivent refléter l'état sans délai.
  revalidatePath("/admin", "layout");
  revalidatePath("/demande");
  return { success: true, enabled };
}

export type UpdateLeadSettingsResult =
  | { success: true }
  | {
      success: false;
      code:
        "INVALID_INPUT" | "WRONG_PASSWORD" | "PASSWORD_NOT_SET" | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * Met à jour les réglages de cycle de vie des leads, avec la même protection
 * que le kill switch (re-auth + AuditLog) : ils pilotent la distribution.
 * Les tableaux lus par le cron sont reconstruits ici, jamais saisis : il
 * rejette toute config sans 3 paliers (dont le sentinel -1) et 2 délais.
 * Écriture en une transaction pour ne jamais exposer un jeu incohérent.
 */
export async function updateLeadSettings(
  raw: unknown,
): Promise<UpdateLeadSettingsResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = leadSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const v = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return {
      success: false,
      code: "PASSWORD_NOT_SET",
      message: "Aucun mot de passe défini sur ce compte.",
    };
  }
  if (!(await bcrypt.compare(v.password, user.passwordHash))) {
    return {
      success: false,
      code: "WRONG_PASSWORD",
      message: "Mot de passe incorrect.",
    };
  }

  // -1 = palier OPEN (seul le rayon du pro s'applique), jamais saisi.
  const paliers = [v.radiusInitialKm, v.radiusExpandedKm, -1];
  const delays = [v.expansionDelay1Min, v.expansionDelay2Min];

  const writes: Array<{ key: string; value: string; valueType: string }> = [
    {
      key: LEAD_SETTINGS_KEYS.souffrance,
      value: String(v.souffranceHours),
      valueType: "int",
    },
    {
      key: LEAD_SETTINGS_KEYS.timeout,
      value: String(v.globalTimeoutHours),
      valueType: "int",
    },
    {
      key: LEAD_SETTINGS_KEYS.maxAcceptances,
      value: String(v.maxAcceptances),
      valueType: "int",
    },
    {
      key: LEAD_SETTINGS_KEYS.paliers,
      value: JSON.stringify(paliers),
      valueType: "json",
    },
    {
      key: LEAD_SETTINGS_KEYS.delays,
      value: JSON.stringify(delays),
      valueType: "json",
    },
  ];

  try {
    await withAuditLog<void>(
      {
        action: "LEAD_SETTINGS_UPDATED",
        actorId: adminUserId,
        target: { type: "AppConfig", id: "lead-settings" },
        inputSummary: {
          souffranceHours: v.souffranceHours,
          globalTimeoutHours: v.globalTimeoutHours,
          maxAcceptances: v.maxAcceptances,
          paliers,
          delays,
        },
      },
      async () => {
        await prisma.$transaction(
          writes.map((w) =>
            prisma.appConfig.upsert({
              where: { key: w.key },
              update: { value: w.value, updatedBy: adminUserId },
              create: {
                key: w.key,
                value: w.value,
                valueType: w.valueType,
                updatedBy: adminUserId,
              },
            }),
          ),
        );
      },
    );
  } catch {
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur interne. Réessayez.",
    };
  }

  // N'invalide le cache (5 min) que sur cette instance : les autres instances
  // serverless attendent l'expiration, d'où « sous 5 minutes » dans l'UI.
  for (const w of writes) invalidateAppConfigCache(w.key);

  revalidatePath("/admin/configuration");
  return { success: true };
}
