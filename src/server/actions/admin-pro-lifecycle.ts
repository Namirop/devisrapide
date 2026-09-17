"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { afterResponse } from "@/lib/after-response";
import { reportIncident } from "@/lib/alerting";
import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { buildProDashboardUrl } from "@/lib/email/helpers";
import {
  sendProReactivatedEmail,
  sendProRejectedEmail,
  sendProSuspendedEmail,
  sendProValidatedEmail,
} from "@/lib/email/sender";
import { backfillLeadsForPro } from "@/lib/matching/backfill";
import { prisma } from "@/lib/prisma";
import { sendPushToProfile } from "@/lib/push/send";

/**
 * Rattrape les leads encore en ligne quand un pro devient éligible. Un échec
 * ne bloque pas la transition mais ouvre un incident : sinon, seul le pro
 * s'en apercevrait, face à un dashboard vide.
 */
async function backfillAfterLifecycleChange(
  proProfileId: string,
): Promise<number> {
  try {
    return await backfillLeadsForPro({ proProfileId });
  } catch (err) {
    await reportIncident("matching.backfill", {
      error: err,
      context: { proProfileId, trigger: "pro-lifecycle" },
    });
    return 0;
  }
}

// Cycle de vie d'un ProProfile (validation, refus, suspension, réactivation),
// actions tracées via withAuditLog (pattern : docs/conventions.md).

const proProfileIdSchema = z.object({
  proProfileId: z.string().min(1),
});

const proProfileWithReasonSchema = z.object({
  proProfileId: z.string().min(1),
  reason: z.string().min(10, "Raison requise (10 caractères minimum).").max(500),
});

export type ProLifecycleResult =
  | { success: true }
  | {
      success: false;
      code: "INVALID_INPUT" | "PRO_NOT_FOUND" | "INVALID_TRANSITION" | "INTERNAL";
      message: string;
    };

/** Passe un pro en VALIDATED et lui attribue les leads déjà en ligne. */
export async function validateProProfile(
  rawInput: unknown,
): Promise<ProLifecycleResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = proProfileIdSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, code: "INVALID_INPUT", message: "ID invalide." };
  }
  const { proProfileId } = parsed.data;

  // Nombre de leads rattrapés, remonté dans le résumé d'audit.
  let backfilledLeads = 0;

  try {
    return await withAuditLog<ProLifecycleResult>(
      {
        action: "PRO_VALIDATED",
        actorId: adminUserId,
        target: { type: "ProProfile", id: proProfileId },
        inputSummary: { proProfileId },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
          backfilledLeads,
        }),
      },
      async (): Promise<ProLifecycleResult> => {
        const pro = await prisma.proProfile.findUnique({
          where: { id: proProfileId },
          select: {
            validationStatus: true,
            companyName: true,
            user: { select: { email: true } },
          },
        });
        if (!pro) {
          return { success: false, code: "PRO_NOT_FOUND", message: "Pro introuvable." };
        }
        if (pro.validationStatus === "VALIDATED") {
          return {
            success: false,
            code: "INVALID_TRANSITION",
            message: "Ce pro est déjà validé.",
          };
        }

        await prisma.proProfile.update({
          where: { id: proProfileId },
          data: {
            validationStatus: "VALIDATED",
            validatedAt: new Date(),
            rejectedReason: null,
            suspensionReason: null,
          },
        });

        // Avant l'email, qui annonce ce nombre. Sans rattrapage, les demandes
        // créées avant la validation ne lui seraient jamais assignées.
        backfilledLeads = await backfillAfterLifecycleChange(proProfileId);

        await sendProValidatedEmail({
          to: pro.user.email,
          companyName: pro.companyName,
          dashboardUrl: buildProDashboardUrl(),
          waitingLeadsCount: backfilledLeads,
          proProfileId,
        });

        afterResponse("push/proValidated", () =>
          sendPushToProfile(proProfileId, {
            title: "Compte validé",
            body: "Votre compte est validé, vous pouvez recevoir des leads.",
            url: "/dashboard",
            tag: `pro-lifecycle-${proProfileId}`,
          }),
        );

        revalidatePath("/admin");
        revalidatePath("/admin/professionnels");
        revalidatePath(`/admin/professionnels/${proProfileId}`);
        return { success: true };
      },
    );
  } catch (err) {
    console.error("[admin/validateProProfile] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, code: "INTERNAL", message: "Erreur interne." };
  }
}

/** Refuse un pro (REJECTED + raison). Réversible via reactivateProProfile. */
export async function rejectProProfile(
  rawInput: unknown,
): Promise<ProLifecycleResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = proProfileWithReasonSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Champs invalides.",
    };
  }
  const { proProfileId, reason } = parsed.data;

  try {
    return await withAuditLog<ProLifecycleResult>(
      {
        action: "PRO_REJECTED",
        actorId: adminUserId,
        target: { type: "ProProfile", id: proProfileId },
        inputSummary: { proProfileId, reason },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
        }),
      },
      async (): Promise<ProLifecycleResult> => {
        const pro = await prisma.proProfile.findUnique({
          where: { id: proProfileId },
          select: {
            validationStatus: true,
            companyName: true,
            user: { select: { email: true } },
          },
        });
        if (!pro) {
          return { success: false, code: "PRO_NOT_FOUND", message: "Pro introuvable." };
        }
        if (pro.validationStatus === "REJECTED") {
          return {
            success: false,
            code: "INVALID_TRANSITION",
            message: "Ce pro est déjà refusé.",
          };
        }

        await prisma.proProfile.update({
          where: { id: proProfileId },
          data: {
            validationStatus: "REJECTED",
            rejectedReason: reason,
          },
        });

        await sendProRejectedEmail({
          to: pro.user.email,
          companyName: pro.companyName,
          reason,
          proProfileId,
        });

        afterResponse("push/proRejected", () =>
          sendPushToProfile(proProfileId, {
            title: "Candidature non retenue",
            body: "Votre candidature n'a pas été retenue.",
            url: "/dashboard",
            tag: `pro-lifecycle-${proProfileId}`,
          }),
        );

        revalidatePath("/admin");
        revalidatePath("/admin/professionnels");
        revalidatePath(`/admin/professionnels/${proProfileId}`);
        return { success: true };
      },
    );
  } catch (err) {
    console.error("[admin/rejectProProfile] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, code: "INTERNAL", message: "Erreur interne." };
  }
}

/**
 * Suspend un pro (SUSPENDED + raison) : requireProSession lui ferme alors le
 * dashboard. Réversible via reactivateProProfile.
 */
export async function suspendProProfile(
  rawInput: unknown,
): Promise<ProLifecycleResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = proProfileWithReasonSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Champs invalides.",
    };
  }
  const { proProfileId, reason } = parsed.data;

  try {
    return await withAuditLog<ProLifecycleResult>(
      {
        action: "PRO_SUSPENDED",
        actorId: adminUserId,
        target: { type: "ProProfile", id: proProfileId },
        inputSummary: { proProfileId, reason },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
        }),
      },
      async (): Promise<ProLifecycleResult> => {
        const pro = await prisma.proProfile.findUnique({
          where: { id: proProfileId },
          select: {
            validationStatus: true,
            companyName: true,
            user: { select: { email: true } },
          },
        });
        if (!pro) {
          return { success: false, code: "PRO_NOT_FOUND", message: "Pro introuvable." };
        }
        if (pro.validationStatus === "SUSPENDED") {
          return {
            success: false,
            code: "INVALID_TRANSITION",
            message: "Ce pro est déjà suspendu.",
          };
        }

        await prisma.proProfile.update({
          where: { id: proProfileId },
          data: {
            validationStatus: "SUSPENDED",
            suspensionReason: reason,
          },
        });

        await sendProSuspendedEmail({
          to: pro.user.email,
          companyName: pro.companyName,
          reason,
          proProfileId,
        });

        afterResponse("push/proSuspended", () =>
          sendPushToProfile(proProfileId, {
            title: "Compte suspendu",
            body: "Votre compte a été suspendu. Consultez votre espace pour plus d'informations.",
            url: "/dashboard",
            tag: `pro-lifecycle-${proProfileId}`,
          }),
        );

        revalidatePath("/admin");
        revalidatePath("/admin/professionnels");
        revalidatePath(`/admin/professionnels/${proProfileId}`);
        return { success: true };
      },
    );
  } catch (err) {
    console.error("[admin/suspendProProfile] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, code: "INTERNAL", message: "Erreur interne." };
  }
}

/**
 * Réactive un pro SUSPENDED ou REJECTED. Un pro PENDING est refusé ici : il
 * doit passer par validateProProfile.
 */
export async function reactivateProProfile(
  rawInput: unknown,
): Promise<ProLifecycleResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = proProfileIdSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, code: "INVALID_INPUT", message: "ID invalide." };
  }
  const { proProfileId } = parsed.data;

  let backfilledLeads = 0;

  try {
    return await withAuditLog<ProLifecycleResult>(
      {
        action: "PRO_REACTIVATED",
        actorId: adminUserId,
        target: { type: "ProProfile", id: proProfileId },
        inputSummary: { proProfileId },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
          backfilledLeads,
        }),
      },
      async (): Promise<ProLifecycleResult> => {
        const pro = await prisma.proProfile.findUnique({
          where: { id: proProfileId },
          select: {
            validationStatus: true,
            companyName: true,
            user: { select: { email: true } },
          },
        });
        if (!pro) {
          return { success: false, code: "PRO_NOT_FOUND", message: "Pro introuvable." };
        }
        if (pro.validationStatus === "VALIDATED") {
          return {
            success: false,
            code: "INVALID_TRANSITION",
            message: "Ce pro est déjà validé.",
          };
        }
        if (pro.validationStatus === "PENDING") {
          return {
            success: false,
            code: "INVALID_TRANSITION",
            message:
              "Ce pro est en attente initiale. Utilisez l'action Valider à la place.",
          };
        }

        await prisma.proProfile.update({
          where: { id: proProfileId },
          data: {
            validationStatus: "VALIDATED",
            validatedAt: new Date(),
            rejectedReason: null,
            suspensionReason: null,
          },
        });

        // Les leads publiés pendant la suspension, encore vivants, lui
        // reviennent.
        backfilledLeads = await backfillAfterLifecycleChange(proProfileId);

        await sendProReactivatedEmail({
          to: pro.user.email,
          companyName: pro.companyName,
          dashboardUrl: buildProDashboardUrl(),
          proProfileId,
        });

        afterResponse("push/proReactivated", () =>
          sendPushToProfile(proProfileId, {
            title: "Compte réactivé",
            body: "Votre compte est de nouveau actif.",
            url: "/dashboard",
            tag: `pro-lifecycle-${proProfileId}`,
          }),
        );

        revalidatePath("/admin");
        revalidatePath("/admin/professionnels");
        revalidatePath(`/admin/professionnels/${proProfileId}`);
        return { success: true };
      },
    );
  } catch (err) {
    console.error("[admin/reactivateProProfile] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, code: "INTERNAL", message: "Erreur interne." };
  }
}
