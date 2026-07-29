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
      code: "INVALID_INPUT" | "WRONG_PASSWORD" | "PASSWORD_NOT_SET" | "INTERNAL";
      message: string;
    };

/**
 * Active / suspend la création de nouvelles demandes client (kill
 * switch). Confirmation par mot de passe admin obligatoire : re-auth
 * bcrypt contre le passwordHash de l'admin courant (même pattern que
 * updateAdminPassword). Tracé via AuditLog (LEAD_CREATION_TOGGLED).
 *
 * Le userId vient de la session (jamais d'un input) → un admin ne peut
 * confirmer qu'avec son propre mot de passe.
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
      code: "INVALID_INPUT" | "WRONG_PASSWORD" | "PASSWORD_NOT_SET" | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * Met à jour les réglages de cycle de vie des leads (souffrance,
 * expiration, acheteurs max, paliers de zone et leurs délais).
 *
 * Même niveau de protection que le kill switch — re-auth bcrypt + AuditLog
 * — parce que ces valeurs pilotent directement le rythme de distribution
 * et donc le chiffre d'affaires.
 *
 * Les deux tableaux consommés par le cron sont reconstruits ici plutôt que
 * saisis : `RADIUS_PALIERS_KM` garde toujours 3 entrées (la 3e étant le
 * sentinel -1 = OPEN) et `ZONE_EXPANSION_DELAYS_MIN` toujours 2, sans quoi
 * le cron s'arrête en silence.
 *
 * Écriture en une transaction : un jeu de réglages incohérent à mi-chemin
 * (nouveau rayon, ancien délai) fausserait le matching jusqu'au prochain
 * enregistrement.
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

  // -1 = sentinel OPEN (toute la Belgique), jamais saisi par l'admin.
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

  // Vide le cache 5 min de getAppConfig sur CETTE instance. Les autres
  // instances serverless garderont l'ancienne valeur jusqu'à expiration
  // naturelle — d'où la mention « sous 5 minutes » côté interface.
  for (const w of writes) invalidateAppConfigCache(w.key);

  revalidatePath("/admin/configuration");
  return { success: true };
}
