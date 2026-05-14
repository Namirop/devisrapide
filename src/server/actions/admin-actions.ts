"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import {
  buildProDashboardUrl,
  urgencyLabel,
} from "@/lib/email/helpers";
import {
  sendLeadGiftedProEmail,
  sendProReactivatedEmail,
  sendProRejectedEmail,
  sendProSuspendedEmail,
  sendProValidatedEmail,
} from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";

// ─── Pro lifecycle actions (validate / reject / suspend / reactivate) ──

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

/**
 * Valide un pro PENDING : passage en VALIDATED, set validatedAt.
 * Email "Compte validé" sera trigger en C17.
 */
export async function validateProProfile(
  rawInput: unknown,
): Promise<ProLifecycleResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = proProfileIdSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, code: "INVALID_INPUT", message: "ID invalide." };
  }
  const { proProfileId } = parsed.data;

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

        await sendProValidatedEmail({
          to: pro.user.email,
          companyName: pro.companyName,
          dashboardUrl: buildProDashboardUrl(),
          proProfileId,
        });

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

/**
 * Refuse un pro PENDING : passage en REJECTED + raison stockée dans
 * rejectedReason. Etat terminal V1 (pas de re-soumission auto, le
 * reactivate manual existe pour reanimer un REJECTED si besoin).
 */
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
 * Suspend un pro VALIDATED : passage en SUSPENDED + raison stockée dans
 * suspensionReason. Le pro perd l'accès dashboard via le guard
 * requireProSession (status check). Réactivable via reactivateProProfile.
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
 * Réactive un pro SUSPENDED ou REJECTED : passage en VALIDATED, clear
 * des reasons. Si le pro etait en PENDING, refus implicite — on ne
 * shortcut pas via cette action (utiliser validateProProfile explicite).
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

        await sendProReactivatedEmail({
          to: pro.user.email,
          companyName: pro.companyName,
          dashboardUrl: buildProDashboardUrl(),
          proProfileId,
        });

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

// ─── Wallet ajustement (adjustWalletBalance) ──────────────────────────

const adjustWalletSchema = z.object({
  proProfileId: z.string().min(1),
  direction: z.enum(["credit", "debit"]),
  amountCents: z.number().int().positive(),
  reason: z
    .string()
    .min(10, "Raison requise (10 caractères minimum).")
    .max(500),
});

export type AdjustWalletResult =
  | { success: true; newBalanceCents: number }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "PRO_NOT_FOUND"
        | "INSUFFICIENT_FUNDS"
        | "INTERNAL";
      message: string;
    };

/**
 * Credit ou debit manuel admin sur le wallet d'un pro. Transaction
 * Prisma atomique :
 *  - direction "credit" : balance += amountCents, WalletTransaction
 *    type ADMIN_CREDIT, raison stockee dans description + adminReason.
 *  - direction "debit" : balance -= amountCents si solde suffisant
 *    (sinon INSUFFICIENT_FUNDS), WalletTransaction type ADMIN_DEBIT.
 *
 * adminActorId est stocke pour audit (champ existant sur
 * WalletTransaction depuis Sprint 2a, prevu pour ce use case).
 *
 * Email de notification au pro non envoye V1 (a discuter Sprint 5 si
 * Kamel veut). Le pro voit le mouvement dans son dashboard wallet.
 */
export async function adjustWalletBalance(
  rawInput: unknown,
): Promise<AdjustWalletResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = adjustWalletSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Champs invalides.",
    };
  }
  const { proProfileId, direction, amountCents, reason } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const pro = await tx.proProfile.findUnique({
        where: { id: proProfileId },
        select: { userId: true, walletBalanceCents: true },
      });
      if (!pro) {
        throw new ActionError("PRO_NOT_FOUND", "Pro introuvable.");
      }

      if (direction === "debit" && pro.walletBalanceCents < amountCents) {
        throw new ActionError(
          "INSUFFICIENT_FUNDS",
          `Solde insuffisant. Solde actuel : ${(pro.walletBalanceCents / 100).toFixed(2)}€.`,
        );
      }

      const newBalance =
        direction === "credit"
          ? pro.walletBalanceCents + amountCents
          : pro.walletBalanceCents - amountCents;

      await tx.proProfile.update({
        where: { id: proProfileId },
        data: { walletBalanceCents: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId: pro.userId,
          type: direction === "credit" ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
          amountCents,
          balanceAfterCents: newBalance,
          description: reason,
          adminReason: reason,
          adminActorId: adminUserId,
        },
      });

      return { newBalance };
    });

    revalidatePath("/admin");
    revalidatePath("/admin/transactions");
    revalidatePath(`/admin/professionnels/${proProfileId}`);

    return { success: true, newBalanceCents: result.newBalance };
  } catch (err) {
    if (err instanceof ActionError) {
      // Le code throw dans adjustWalletBalance est garanti dans
      // { PRO_NOT_FOUND, INSUFFICIENT_FUNDS } par construction (seuls
      // 2 throw possibles dans la transaction). Cast pour reduire le
      // AdminActionErrorCode generique au sous-set du Result type.
      return {
        success: false,
        code: err.code as "PRO_NOT_FOUND" | "INSUFFICIENT_FUNDS",
        message: err.message,
      };
    }
    console.error("[admin/adjustWalletBalance] failed", {
      adminUserId,
      proProfileId,
      direction,
      amountCents,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur interne. Réessayez.",
    };
  }
}

// ─── Update profil pro (admin override) ───────────────────────────────

const updateProSchema = z.object({
  proProfileId: z.string().min(1),
  // Champs ProProfile autorises (V1 — geoloc + postal exclus, change
  // de zone necessite re-geocode et c'est V2).
  companyName: z.string().min(1).max(200).optional(),
  vatNumber: z.string().min(1).max(50).optional(),
  interventionRadiusKm: z.union([z.literal(30), z.literal(60), z.literal(-1)]).optional(),
  autoAccept: z.boolean().optional(),
  // Champs User autorises.
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export type UpdateProResult =
  | { success: true }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "PRO_NOT_FOUND"
        | "EMAIL_CONFLICT"
        | "VAT_CONFLICT"
        | "INTERNAL";
      message: string;
    };

/**
 * Update admin override sur ProProfile + User d'un pro. V1 : champs
 * limites (companyName, vatNumber, radius, autoAccept, email, phone,
 * firstName, lastName). Geoloc (postalCode/city/lat/lng) exclue —
 * change de zone necessiterait un re-geocode V2.
 *
 * Validation Zod sur chaque champ optionnel. Conflits unique (email
 * deja pris, vatNumber deja pris par un autre pro) catched explicitly
 * → returns EMAIL_CONFLICT ou VAT_CONFLICT.
 *
 * Transaction Prisma atomique (User + ProProfile updates ensemble).
 */
export async function updateProProfileAdmin(
  rawInput: unknown,
): Promise<UpdateProResult> {
  await requireAdminSession();

  const parsed = updateProSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "Champs invalides.",
    };
  }
  const { proProfileId, ...updates } = parsed.data;

  try {
    const pro = await prisma.proProfile.findUnique({
      where: { id: proProfileId },
      select: { id: true, userId: true },
    });
    if (!pro) {
      return { success: false, code: "PRO_NOT_FOUND", message: "Pro introuvable." };
    }

    const proFields = {
      ...(updates.companyName !== undefined && { companyName: updates.companyName }),
      ...(updates.vatNumber !== undefined && { vatNumber: updates.vatNumber }),
      ...(updates.interventionRadiusKm !== undefined && {
        interventionRadiusKm: updates.interventionRadiusKm,
      }),
      ...(updates.autoAccept !== undefined && { autoAccept: updates.autoAccept }),
    };
    const userFields = {
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.phone !== undefined && { phone: updates.phone }),
      ...(updates.firstName !== undefined && { firstName: updates.firstName }),
      ...(updates.lastName !== undefined && { lastName: updates.lastName }),
    };

    await prisma.$transaction(async (tx) => {
      if (Object.keys(proFields).length > 0) {
        await tx.proProfile.update({
          where: { id: proProfileId },
          data: proFields,
        });
      }
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({
          where: { id: pro.userId },
          data: userFields,
        });
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/professionnels");
    revalidatePath(`/admin/professionnels/${proProfileId}`);
    return { success: true };
  } catch (err) {
    // Conflits unique Prisma : P2002 sur User.email ou ProProfile.vatNumber.
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const target = (err as { meta?: { target?: string[] } }).meta?.target;
      if (target?.includes("email")) {
        return {
          success: false,
          code: "EMAIL_CONFLICT",
          message: "Cet email est déjà utilisé par un autre compte.",
        };
      }
      if (target?.includes("vatNumber")) {
        return {
          success: false,
          code: "VAT_CONFLICT",
          message: "Ce numéro de TVA est déjà utilisé par un autre pro.",
        };
      }
    }
    console.error("[admin/updateProProfileAdmin] failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, code: "INTERNAL", message: "Erreur interne." };
  }
}

// ─── Lead actions (assignLeadGratis) ──────────────────────────────────

const assignLeadGratisSchema = z.object({
  leadId: z.string().min(1),
  proProfileId: z.string().min(1),
  adminNote: z.string().max(500).optional(),
});

export type AssignLeadGratisResult =
  | { success: true; assignmentId: string }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "LEAD_NOT_FOUND"
        | "LEAD_EXPIRED"
        | "PRO_NOT_FOUND"
        | "PRO_NOT_VALIDATED"
        | "ALREADY_ASSIGNED"
        | "INTERNAL";
      message: string;
    };

/**
 * Admin offre un lead a un pro VALIDATED gratuitement. Cree un
 * LeadAssignment status ACCEPTED, priceCents=0, adminGifted=true,
 * adminGiftedBy=adminUserId. Pas de debit wallet. Email pro sera
 * trigger en C17 (wire emails into actions).
 *
 * Transaction Prisma atomique :
 *  1. Re-fetch lead + pro pour validation (defense vs race-condition)
 *  2. Verifier pas deja assigned (unique [leadId, proProfileId])
 *  3. Creer LeadAssignment
 *  4. Si Lead etait PENDING_MATCH ou ASSIGNED, transition vers ACCEPTED
 *     (un lead "offert" devient comme un lead achete cote workflow).
 */
export async function assignLeadGratis(
  rawInput: unknown,
): Promise<AssignLeadGratisResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = assignLeadGratisSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Champs invalides.",
    };
  }
  const { leadId, proProfileId, adminNote } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          status: true,
          isExclusive: true,
          sharedLeadPriceCentsSnapshot: true,
          exclusiveLeadPriceCentsSnapshot: true,
          deletedAt: true,
        },
      });
      if (!lead || lead.deletedAt) {
        throw new ActionError("LEAD_NOT_FOUND", "Lead introuvable.");
      }
      if (lead.status === "EXPIRED" || lead.status === "CANCELLED") {
        throw new ActionError(
          "LEAD_EXPIRED",
          "Ce lead n'est plus disponible (expiré ou annulé).",
        );
      }

      const pro = await tx.proProfile.findUnique({
        where: { id: proProfileId },
        select: { id: true, userId: true, validationStatus: true },
      });
      if (!pro) {
        throw new ActionError("PRO_NOT_FOUND", "Pro introuvable.");
      }
      if (pro.validationStatus !== "VALIDATED") {
        throw new ActionError(
          "PRO_NOT_VALIDATED",
          "Ce pro n'est pas validé. Seuls les pros validés peuvent recevoir un lead offert.",
        );
      }

      // Verifie le unique [leadId, proProfileId] : un pro ne peut pas
      // avoir 2 assignments sur le meme lead.
      const existing = await tx.leadAssignment.findUnique({
        where: {
          leadId_proProfileId: { leadId, proProfileId },
        },
        select: { id: true },
      });
      if (existing) {
        throw new ActionError(
          "ALREADY_ASSIGNED",
          "Ce pro a déjà cet assignment (refusé, accepté ou en attente).",
        );
      }

      // expiresAt requis sur LeadAssignment, on met une valeur honnetique
      // pour un lead offert ACCEPTED direct (pas de timer effectif).
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const assignment = await tx.leadAssignment.create({
        data: {
          leadId,
          proProfileId,
          proUserId: pro.userId,
          status: "ACCEPTED",
          priceCents: 0,
          isExclusive: lead.isExclusive,
          radiusKmAtAssignment: 0, // Pas matche par geo, admin override
          acceptedAt: new Date(),
          expiresAt,
          adminGifted: true,
          adminGiftedBy: adminUserId,
          refusalReason: adminNote ?? null, // reuse field pour stocker la note admin
        },
      });

      // Si lead en PENDING_MATCH ou ASSIGNED → transition vers ACCEPTED
      // (workflow standard, le lead est consomme par cette acceptation).
      if (lead.status === "PENDING_MATCH" || lead.status === "ASSIGNED") {
        await tx.lead.update({
          where: { id: leadId },
          data: { status: "ACCEPTED" },
        });
      }

      return { assignmentId: assignment.id };
    });

    // Send "Lead offert" email post-transaction. Re-fetch les donnees
    // complètes du lead + pro user pour construire le payload email.
    const emailData = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        clientFirstName: true,
        clientLastName: true,
        clientEmail: true,
        clientPhone: true,
        description: true,
        urgency: true,
        postalCode: true,
        city: true,
        address: true,
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
        assignments: {
          where: { id: result.assignmentId },
          select: {
            proProfile: {
              select: {
                user: { select: { email: true } },
              },
            },
          },
          take: 1,
        },
      },
    });
    const proEmail = emailData?.assignments[0]?.proProfile.user.email;
    if (emailData && proEmail) {
      await sendLeadGiftedProEmail({
        to: proEmail,
        clientFirstName: emailData.clientFirstName,
        clientLastName: emailData.clientLastName,
        clientEmail: emailData.clientEmail,
        clientPhone: emailData.clientPhone,
        categoryName: emailData.subCategory.category.name,
        subCategoryName: emailData.subCategory.name,
        urgencyLabel: urgencyLabel(emailData.urgency),
        postalCode: emailData.postalCode,
        city: emailData.city,
        address: emailData.address,
        description: emailData.description,
        adminNote: parsed.data.adminNote ?? null,
        proProfileId,
        leadId,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);

    return { success: true, assignmentId: result.assignmentId };
  } catch (err) {
    if (err instanceof ActionError) {
      // Le code throw dans assignLeadGratis est garanti dans le set
      // { LEAD_NOT_FOUND, LEAD_EXPIRED, PRO_NOT_FOUND, PRO_NOT_VALIDATED,
      // ALREADY_ASSIGNED } par construction. Cast pour reduire au
      // sous-set du Result type.
      return {
        success: false,
        code: err.code as
          | "LEAD_NOT_FOUND"
          | "LEAD_EXPIRED"
          | "PRO_NOT_FOUND"
          | "PRO_NOT_VALIDATED"
          | "ALREADY_ASSIGNED",
        message: err.message,
      };
    }
    console.error("[admin/assignLeadGratis] failed", {
      adminUserId,
      leadId,
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur interne. Réessayez.",
    };
  }
}

type AdminActionErrorCode =
  | "LEAD_NOT_FOUND"
  | "LEAD_EXPIRED"
  | "PRO_NOT_FOUND"
  | "PRO_NOT_VALIDATED"
  | "ALREADY_ASSIGNED"
  | "INSUFFICIENT_FUNDS";

class ActionError extends Error {
  constructor(
    public readonly code: AdminActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}
