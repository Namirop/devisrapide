"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProSession, UnauthorizedError } from "@/lib/auth-guards";
import { getAppConfig } from "@/lib/config";
import { buildProMesDemandesUrl, urgencyLabel } from "@/lib/email/helpers";
import { sendLeadAcceptedProEmail } from "@/lib/email/sender";
import { closeLeadIfFull } from "@/lib/matching/close-lead";
import {
  notifyLeadNoLongerAvailable,
  notifyLowBalanceIfCrossed,
} from "@/lib/notifications/lead-purchase";
import { computeAssignmentPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { runSerializable } from "@/lib/serializable-tx";
import {
  WalletInsufficientFundsError,
  debitWalletForLead,
} from "@/lib/wallet/debit";

// ─── acceptLeadAssignment ───────────────────────────────────
// Achat d'un lead par un pro. Les pré-contrôles hors transaction ne sont
// qu'un filtre rapide : la transaction Serializable verrouille le Lead,
// recompte les acheteurs (course avec un autre pro), débite le wallet et
// ferme le lead s'il est complet. Les notifications partent après commit.

const acceptInputSchema = z.object({
  assignmentId: z.string().min(1),
  // true = achat en exclusivité (seul acheteur, au prix exclusif).
  exclusive: z.boolean().optional(),
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
        | "EXCLUSIVE_UNAVAILABLE"
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
  const { assignmentId, exclusive } = parsed.data;

  // Exige un pro VALIDATED : bloque PENDING, SUSPENDED et REJECTED.
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

  // Pré-contrôles best-effort, revérifiés sous verrou dans la transaction.
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
          sharedLeadPriceCentsSnapshot: true,
          exclusiveLeadPriceCentsSnapshot: true,
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
        select: {
          walletBalanceCents: true,
          notifyByEmail: true,
          companyName: true,
        },
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

  // Un assignment déjà exclusif le reste quel que soit le choix du pro. Le
  // prix vient du snapshot figé à la création du lead ; l'exclusif est un
  // montant absolu réglé dans /admin/prix, pas un multiple du prix partagé.
  const effectiveExclusive = exclusive === true || assignment.isExclusive;
  const priceCents = computeAssignmentPrice({
    lead: assignment.lead,
    isExclusive: effectiveExclusive,
  });
  const maxAcceptances = effectiveExclusive
    ? 1
    : await getAppConfig("SHARED_LEAD_MAX_ACCEPTANCES", "int");

  if (assignment.proProfile.walletBalanceCents < priceCents) {
    return {
      success: false,
      code: "INSUFFICIENT_FUNDS",
      message:
        "Solde wallet insuffisant. Rechargez votre wallet avant d'accepter ce lead.",
    };
  }

  // Pros dont le PENDING expire si cet achat complète le lead, à prévenir
  // après commit.
  let expiredOtherProProfileIds: ReadonlyArray<string> = [];

  try {
    const debitResult = await runSerializable(
      "acceptLeadAssignment",
      async (tx) => {
        // Verrou sur le Lead : sérialise les achats concurrents.
        await tx.$queryRaw`
          SELECT "id" FROM "Lead" WHERE "id" = ${assignment.leadId} FOR UPDATE
        `;

        const acceptedCount = await tx.leadAssignment.count({
          where: { leadId: assignment.leadId, status: "ACCEPTED" },
        });
        // L'exclusivité n'est possible que tant que personne n'a acheté.
        if (effectiveExclusive && acceptedCount > 0) {
          throw new LeadNoLongerExclusiveError();
        }
        if (acceptedCount >= maxAcceptances) {
          throw new LeadFullError();
        }

        await tx.leadAssignment.update({
          where: { id: assignmentId },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            isExclusive: effectiveExclusive,
            priceCents,
          },
        });

        const debit = await debitWalletForLead({
          tx,
          proProfileId: assignment.proProfileId,
          proUserId: assignment.proUserId,
          amountCents: priceCents,
          leadAssignmentId: assignmentId,
          description: effectiveExclusive
            ? "Acceptation lead (exclusif)"
            : "Acceptation lead",
        });

        expiredOtherProProfileIds = await closeLeadIfFull({
          tx,
          leadId: assignment.leadId,
          maxAcceptances,
          keepAssignmentId: assignmentId,
        });

        return debit;
      },
    );

    // Push aux seuls pros encore PENDING au moment de l'achat ; pas d'email,
    // pour ne pas spammer.
    notifyLeadNoLongerAvailable({
      proProfileIds: expiredOtherProProfileIds,
      leadId: assignment.leadId,
      city: assignment.lead.city,
    });

    // deliver() absorbe les échecs d'envoi et respecte l'opt-out notifyByEmail.
    if (assignment.proUser.email) {
      await sendLeadAcceptedProEmail({
        to: assignment.proUser.email,
        notifyByEmail: assignment.proProfile.notifyByEmail,
        companyName: assignment.proProfile.companyName,
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
        priceCents,
        assignmentUrl: buildProMesDemandesUrl(assignmentId),
      });
    }

    notifyLowBalanceIfCrossed({
      proProfileId: assignment.proProfileId,
      proEmail: assignment.proUser.email,
      notifyByEmail: assignment.proProfile.notifyByEmail,
      companyName: assignment.proProfile.companyName,
      balanceBeforeCents: debitResult.balanceBeforeCents,
      balanceAfterCents: debitResult.balanceAfterCents,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/mes-demandes");
    return { success: true };
  } catch (err) {
    if (err instanceof LeadNoLongerExclusiveError) {
      return {
        success: false,
        code: "EXCLUSIVE_UNAVAILABLE",
        message:
          "Ce lead n'est plus disponible en exclusivité : un autre pro l'a déjà pris.",
      };
    }
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

class LeadNoLongerExclusiveError extends Error {
  constructor() {
    super("Lead no longer available in exclusive mode");
    this.name = "LeadNoLongerExclusiveError";
  }
}

// ─── refuseLeadAssignment ───────────────────────────────────
// Refus silencieux (ni email, ni information côté particulier). La ligne
// REFUSED est conservée pour les stats et évite de reproposer le lead au pro.

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

  // Exige un pro VALIDATED : un compte suspendu ne peut pas refuser.
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
