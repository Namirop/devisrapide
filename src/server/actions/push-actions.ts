"use server";

import { z } from "zod";

import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Abonnements Web Push du pro. Pas d'AuditLog : le pro n'agit que sur ses
// propres appareils.

const savePushSubscriptionSchema = z.object({
  endpoint: z.string().url().min(1).max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  userAgent: z.string().max(500).optional(),
});

const deletePushSubscriptionSchema = z.object({
  endpoint: z.string().url().min(1).max(2000),
});

export type PushActionResult =
  | { success: true }
  | {
      success: false;
      code: "INVALID_INPUT" | "INTERNAL";
      message: string;
    };

/**
 * Upsert par endpoint (unique) : un navigateur qui renouvelle ses clés met
 * la ligne à jour. Le proProfileId vient de la session, jamais du payload.
 */
export async function savePushSubscription(
  rawInput: unknown,
): Promise<PushActionResult> {
  const { proProfileId } = await requireProSession();

  const parsed = savePushSubscriptionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Subscription invalide.",
    };
  }
  const { endpoint, p256dh, auth, userAgent } = parsed.data;

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth,
        userAgent: userAgent ?? null,
        proProfileId,
        lastUsedAt: new Date(),
      },
      create: {
        proProfileId,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent ?? null,
      },
    });
    return { success: true };
  } catch (err) {
    console.error("[push/savePushSubscription] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur lors de l'enregistrement.",
    };
  }
}

/**
 * Suppression idempotente, limitée aux abonnements du pro courant : impossible
 * de retirer l'appareil d'un autre pro.
 */
export async function deletePushSubscription(
  rawInput: unknown,
): Promise<PushActionResult> {
  const { proProfileId } = await requireProSession();

  const parsed = deletePushSubscriptionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Endpoint invalide.",
    };
  }
  const { endpoint } = parsed.data;

  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, proProfileId },
    });
    return { success: true };
  } catch (err) {
    console.error("[push/deletePushSubscription] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur lors de la suppression.",
    };
  }
}
