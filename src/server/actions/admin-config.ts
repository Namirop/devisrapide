"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import {
  LEAD_CREATION_ENABLED_KEY,
  setLeadCreationEnabled,
} from "@/lib/lead-creation-switch";
import { prisma } from "@/lib/prisma";
import { toggleLeadCreationSchema } from "@/schemas/admin-config";

export type ToggleLeadCreationResult =
  | { success: true; enabled: boolean }
  | {
      success: false;
      code: "INVALID_INPUT" | "WRONG_PASSWORD" | "PASSWORD_NOT_SET" | "INTERNAL";
      message: string;
    };

/**
 * Active / suspend la création de nouvelles demandes client (kill switch
 * Sprint C). Confirmation par mot de passe admin obligatoire : re-auth
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
