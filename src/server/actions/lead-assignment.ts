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
//
// Server Action declenchee par le pro depuis son dashboard
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
  // Choix du pro a l'achat : true = prendre le lead en exclusivite (1 seul
  // pro, au prix exclusif). Optionnel, defaut false = achat standard.
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

  // Mode d'achat : le pro choisit standard ou exclusif sur la page detail.
  // Un lead deja marque exclusif (lead.isExclusive) reste exclusif quel que
  // soit le choix. Le prix vient du bon snapshot du Lead (deja calcule a la
  // creation) — pas de recalcul a la volee ici. Le prix exclusif est une
  // valeur ABSOLUE reglee par l'admin dans /admin/prix, pas un multiple du
  // prix partage : le catalogue par defaut la seede a 2,5x, mais rien dans
  // le code n'impose ce rapport.
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

  // Collecte des proProfileId des autres pros dont le PENDING va etre
  // EXPIRED par cette acceptance — sert au push E (lead pris) envoye
  // apres commit. Vide si le lead n'atteint pas son cap d'acceptances.
  let expiredOtherProProfileIds: ReadonlyArray<string> = [];

  try {
    const debitResult = await runSerializable(
      "acceptLeadAssignment",
      async (tx) => {
        // Lock le Lead pour serialiser les acceptations concurrentes.
        await tx.$queryRaw`
          SELECT "id" FROM "Lead" WHERE "id" = ${assignment.leadId} FOR UPDATE
        `;

        const acceptedCount = await tx.leadAssignment.count({
          where: { leadId: assignment.leadId, status: "ACCEPTED" },
        });
        // Exclusivite : disponible uniquement tant que 0 acheteur. Des qu'un
        // pro (standard ou exclusif) a pris le lead, l'option exclusif tombe.
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

        // Si le lead est full apres cette acceptation : expire les autres
        // PENDING et passe le Lead en ACCEPTED. Les proProfileId retournes
        // alimentent le push E "lead pris" (hors transaction, plus bas).
        expiredOtherProProfileIds = await closeLeadIfFull({
          tx,
          leadId: assignment.leadId,
          maxAcceptances,
          keepAssignmentId: assignmentId,
        });

        return debit;
      },
    );

    // Previent les pros qui etaient toujours dans la course (PENDING) au
    // moment ou celui-ci a accepte. Throttling naturel via le filtre
    // PENDING dans la transaction : un assignment deja EXPIRED n'est pas
    // dans la liste. Pas d'email V1 pour eviter le spam.
    notifyLeadNoLongerAvailable({
      proProfileIds: expiredOtherProProfileIds,
      leadId: assignment.leadId,
      city: assignment.lead.city,
    });

    // Email "Lead accepté" — fire-and-forget hors transaction. Master-
    // switch notifyByEmail respecte par deliver() (requiresOptIn).
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
//
// Server Action declenchee par le pro pour refuser une assignment
// PENDING. Pas d'email particulier au pro (silencieux). Le particulier
// ne sait pas non plus quels pros ont refuse — c'est interne au systeme
// pour analyses et eviter de re-notifier ce pro sur le meme lead.

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
  // Fix : un pro SUSPENDED ne peut donc plus refuser de leads
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
