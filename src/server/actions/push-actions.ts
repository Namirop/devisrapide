"use server";

import { z } from "zod";

import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Server Actions pour la gestion des PushSubscription cote pro :
//   savePushSubscription   : upsert par endpoint (unique) au moment de
//                            l'opt-in navigateur
//   deletePushSubscription : retrait d'un device specifique
//
// Pas d'AuditLog : ces actions concernent l'utilisateur lui-meme sur
// ses propres devices, pas d'enjeu admin/securite a tracer.

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
 * Upsert d'une PushSubscription. Si l'endpoint existe deja :
 * - update p256dh/auth/userAgent (au cas ou le navigateur a renouvele)
 * - update lastUsedAt
 *
 * Le rattachement au proProfileId vient de la session (requireProSession),
 * pas du payload — un pro ne peut pas enregistrer une subscription au
 * nom d'un autre.
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
 * Suppression d'une PushSubscription pour le pro courant. Scope par
 * proProfileId pour empecher un pro de supprimer le device d'un autre.
 * Idempotent : si l'endpoint n'existe pas, success quand meme.
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
