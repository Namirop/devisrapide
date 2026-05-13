"use server";

import { LeadFollowupStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getAppConfig } from "@/lib/config";
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
        | "UNAUTHENTICATED"
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

  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      code: "UNAUTHENTICATED",
      message: "Vous devez être connecté.",
    };
  }
  if (session.user.role !== "PRO") {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Accès réservé aux professionnels.",
    };
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
  if (assignment.proUserId !== session.user.id) {
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
// 4. TODO commit 12 : trigger email "Lead accepte" (coordonnees client).

const acceptInputSchema = z.object({
  assignmentId: z.string().min(1),
});

export type AcceptLeadResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "UNAUTHENTICATED"
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

  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      code: "UNAUTHENTICATED",
      message: "Vous devez être connecté.",
    };
  }
  if (session.user.role !== "PRO") {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Accès réservé aux professionnels.",
    };
  }
  if (session.user.validationStatus !== "VALIDATED") {
    return {
      success: false,
      code: "FORBIDDEN",
      message:
        "Votre compte n'est pas encore validé. Vous ne pouvez pas accepter de leads.",
    };
  }

  // ── Pre-checks lectures (hors transaction) ────────────────
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
        select: { status: true, expiresAt: true },
      },
      proProfile: {
        select: { walletBalanceCents: true },
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
  if (assignment.proUserId !== session.user.id) {
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

    // TODO commit 12 : sendLeadAcceptedProEmail (coordonnees client)
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
        | "UNAUTHENTICATED"
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

  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      code: "UNAUTHENTICATED",
      message: "Vous devez être connecté.",
    };
  }
  if (session.user.role !== "PRO") {
    return {
      success: false,
      code: "FORBIDDEN",
      message: "Accès réservé aux professionnels.",
    };
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
  if (assignment.proUserId !== session.user.id) {
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
