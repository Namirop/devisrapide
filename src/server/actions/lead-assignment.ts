"use server";

import { LeadFollowupStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProSession, UnauthorizedError } from "@/lib/auth-guards";
import { getAppConfig } from "@/lib/config";
import { urgencyLabel } from "@/lib/email/helpers";
import { sendLeadAcceptedProEmail } from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";
import {
  WalletInsufficientFundsError,
  debitWalletForLead,
} from "@/lib/wallet/debit";

// Server Action pour qualifier le devenir d'un lead apres acceptation par
// le pro. Pose en Phase 4 (BE adaptations), consomme par le dashboard pro
// Sprint 2+.
//
// Permissions :
//   - Pro authentifie uniquement
//   - Le pro doit etre le proprietaire de l'assignment (proUserId match
//     session.user.id)
//   - L'assignment doit etre dans status ACCEPTED (pas de qualification
//     sur un assignment encore PENDING/REFUSED/EXPIRED)

const inputSchema = z.object({
  assignmentId: z.string().min(1),
  status: z.nativeEnum(LeadFollowupStatus),
});

export type UpdateFollowupStatusResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "FORBIDDEN"
        | "NOT_FOUND"
        | "WRONG_STATE"
        | "INTERNAL";
      message: string;
    };

export async function updateFollowupStatus(
  rawInput: unknown,
): Promise<UpdateFollowupStatusResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Données invalides.",
    };
  }
  const { assignmentId, status } = parsed.data;

  // requireProSession check : session + role PRO + validationStatus VALIDATED.
  // Un pro SUSPENDED ne peut donc pas qualifier ses leads (alignement
  // avec la regle "compte suspendu = acces dashboard coupe").
  let userId: string;
  try {
    ({ userId } = await requireProSession());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, code: "FORBIDDEN", message: "Accès refusé." };
    }
    throw err;
  }

  const assignment = await prisma.leadAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, proUserId: true, status: true },
  });
  if (!assignment) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Assignment introuvable.",
    };
  }
  if (assignment.proUserId !== userId) {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Cet assignment ne vous appartient pas.",
    };
  }
  if (assignment.status !== "ACCEPTED") {
    return {
      success: false,
      code: "WRONG_STATE",
      message: "Seul un assignment accepté peut être qualifié.",
    };
  }

  try {
    await prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: { followupStatus: status },
    });
    revalidatePath("/dashboard/mes-demandes");
    revalidatePath(`/dashboard/mes-demandes/${assignmentId}`);
    return { success: true };
  } catch (err) {
    console.error("[updateFollowupStatus] DB failure", err);
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue.",
    };
  }
}

// ─── acceptLeadAssignment ───────────────────────────────────
//
// Server Action declenchee par le pro depuis son dashboard (Sprint 2b)
// pour accepter une assignment PENDING.
//
// Etapes :
// 1. Auth check : pro VALIDATED + proprietaire de l'assignment.
// 2. Pre-checks lectures : assignment PENDING + non expire + lead non
//    expire + wallet suffisant.
// 3. Transaction Serializable :
//    - Re-lock le Lead via SELECT FOR UPDATE.
//    - Re-count ACCEPTED courant ; refuse si lock max atteint (race
//      avec un autre pro qui aurait accepte entre les checks).
//    - Update assignment ACCEPTED + acceptedAt.
//    - Debit wallet via debitWalletForLead.
//    - Si lead full apres : tous les PENDING restants -> EXPIRED, Lead
//      -> status ACCEPTED.
// 4. Trigger email "Lead accepte" avec coordonnees client (fire-and-forget
//    hors transaction, voir fin de la fonction).

const acceptInputSchema = z.object({
  assignmentId: z.string().min(1),
});

export type AcceptLeadResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "FORBIDDEN"
        | "NOT_FOUND"
        | "WRONG_STATE"
        | "EXPIRED"
        | "LEAD_FULL"
        | "INSUFFICIENT_FUNDS"
        | "INTERNAL";
      message: string;
    };

export async function acceptLeadAssignment(
  rawInput: unknown,
): Promise<AcceptLeadResult> {
  const parsed = acceptInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Données invalides.",
    };
  }
  const { assignmentId } = parsed.data;

  // requireProSession check : session + role PRO + validationStatus VALIDATED
  // + proProfileId not null. Bloque PENDING / SUSPENDED / REJECTED.
  let userId: string;
  try {
    ({ userId } = await requireProSession());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return {
        success: false,
        code: "FORBIDDEN",
        message: "Accès refusé. Vérifiez que votre compte est validé.",
      };
    }
    throw err;
  }

  // ── Pre-checks lectures (hors transaction) — best-effort, l'autorite ──
  // ── est la transaction Serializable + FOR UPDATE de debitWalletForLead. ──
  const assignment = await prisma.leadAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      proUserId: true,
      proProfileId: true,
      status: true,
      priceCents: true,
      expiresAt: true,
      isExclusive: true,
      leadId: true,
      lead: {
        select: {
          status: true,
          expiresAt: true,
          clientFirstName: true,
          clientLastName: true,
          clientEmail: true,
          clientPhone: true,
          urgency: true,
          postalCode: true,
          city: true,
          address: true,
          description: true,
          subCategory: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      proProfile: {
        select: { walletBalanceCents: true, notifyByEmail: true },
      },
      proUser: {
        select: { email: true },
      },
    },
  });
  if (!assignment) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Assignment introuvable.",
    };
  }
  if (assignment.proUserId !== userId) {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Cet assignment ne vous appartient pas.",
    };
  }
  if (assignment.status !== "PENDING") {
    return {
      success: false,
      code: "WRONG_STATE",
      message: "Cet assignment n'est plus en attente.",
    };
  }
  const now = new Date();
  const leadExpired =
    assignment.lead.expiresAt !== null && assignment.lead.expiresAt < now;
  if (assignment.expiresAt < now || leadExpired) {
    return {
      success: false,
      code: "EXPIRED",
      message: "Ce lead a expiré.",
    };
  }
  if (assignment.proProfile.walletBalanceCents < assignment.priceCents) {
    return {
      success: false,
      code: "INSUFFICIENT_FUNDS",
      message:
        "Solde wallet insuffisant. Rechargez votre wallet avant d'accepter ce lead.",
    };
  }

  // ── Transaction atomique acceptation ──────────────────────
  const maxAcceptances = assignment.isExclusive
    ? 1
    : await getAppConfig("SHARED_LEAD_MAX_ACCEPTANCES", "int");

  try {
    await prisma.$transaction(
      async (tx) => {
        // Lock le Lead pour serialiser les acceptations concurrentes.
        await tx.$queryRaw`
          SELECT "id" FROM "Lead" WHERE "id" = ${assignment.leadId} FOR UPDATE
        `;

        const acceptedCount = await tx.leadAssignment.count({
          where: { leadId: assignment.leadId, status: "ACCEPTED" },
        });
        if (acceptedCount >= maxAcceptances) {
          throw new LeadFullError();
        }

        await tx.leadAssignment.update({
          where: { id: assignmentId },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });

        await debitWalletForLead({
          tx,
          proProfileId: assignment.proProfileId,
          proUserId: assignment.proUserId,
          amountCents: assignment.priceCents,
          leadAssignmentId: assignmentId,
          description: "Acceptation lead",
        });

        // Si le lead est full apres cette acceptation : expire les
        // autres PENDING et passe le Lead en ACCEPTED.
        if (acceptedCount + 1 >= maxAcceptances) {
          await tx.leadAssignment.updateMany({
            where: {
              leadId: assignment.leadId,
              status: "PENDING",
              id: { not: assignmentId },
            },
            data: { status: "EXPIRED" },
          });
          await tx.lead.update({
            where: { id: assignment.leadId },
            data: { status: "ACCEPTED" },
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Email "Lead accepté" — fire-and-forget hors transaction.
    if (assignment.proProfile.notifyByEmail && assignment.proUser.email) {
      await sendLeadAcceptedProEmail({
        to: assignment.proUser.email,
        clientFirstName: assignment.lead.clientFirstName,
        clientLastName: assignment.lead.clientLastName,
        clientEmail: assignment.lead.clientEmail,
        clientPhone: assignment.lead.clientPhone,
        categoryName: assignment.lead.subCategory.category.name,
        subCategoryName: assignment.lead.subCategory.name,
        urgencyLabel: urgencyLabel(assignment.lead.urgency),
        postalCode: assignment.lead.postalCode,
        city: assignment.lead.city,
        address: assignment.lead.address,
        description: assignment.lead.description,
        priceCents: assignment.priceCents,
      });
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/mes-demandes");
    return { success: true };
  } catch (err) {
    if (err instanceof LeadFullError) {
      return {
        success: false,
        code: "LEAD_FULL",
        message:
          "Ce lead a déjà reçu le nombre maximum d'acceptations. Trop tard !",
      };
    }
    if (err instanceof WalletInsufficientFundsError) {
      return {
        success: false,
        code: "INSUFFICIENT_FUNDS",
        message: "Solde wallet insuffisant.",
      };
    }
    console.error("[acceptLeadAssignment] DB failure", err);
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue.",
    };
  }
}

class LeadFullError extends Error {
  constructor() {
    super("Lead already at max acceptances");
    this.name = "LeadFullError";
  }
}

// ─── refuseLeadAssignment ───────────────────────────────────
//
// Server Action declenchee par le pro pour refuser une assignment
// PENDING. Pas d'email particulier au pro (silencieux). Le particulier
// ne sait pas non plus quels pros ont refuse — c'est interne au systeme
// pour analyses Kamel et eviter de re-notifier ce pro sur le meme lead.

const refuseInputSchema = z.object({
  assignmentId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export type RefuseLeadResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "FORBIDDEN"
        | "NOT_FOUND"
        | "WRONG_STATE"
        | "INTERNAL";
      message: string;
    };

export async function refuseLeadAssignment(
  rawInput: unknown,
): Promise<RefuseLeadResult> {
  const parsed = refuseInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Données invalides.",
    };
  }
  const { assignmentId, reason } = parsed.data;

  // requireProSession check : session + role PRO + validationStatus VALIDATED.
  // Sprint 5b fix : un pro SUSPENDED ne peut donc plus refuser de leads
  // (avant : seul role PRO etait check, un SUSPENDED passait au travers).
  let userId: string;
  try {
    ({ userId } = await requireProSession());
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, code: "FORBIDDEN", message: "Accès refusé." };
    }
    throw err;
  }

  const assignment = await prisma.leadAssignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, proUserId: true, status: true },
  });
  if (!assignment) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Assignment introuvable.",
    };
  }
  if (assignment.proUserId !== userId) {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Cet assignment ne vous appartient pas.",
    };
  }
  if (assignment.status !== "PENDING") {
    return {
      success: false,
      code: "WRONG_STATE",
      message: "Cet assignment n'est plus en attente.",
    };
  }

  try {
    await prisma.leadAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "REFUSED",
        refusedAt: new Date(),
        refusalReason: reason ?? null,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (err) {
    console.error("[refuseLeadAssignment] DB failure", err);
    return {
      success: false,
      code: "INTERNAL",
      message: "Une erreur interne est survenue.",
    };
  }
}
