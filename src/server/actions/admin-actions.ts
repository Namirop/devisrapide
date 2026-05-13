"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

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

    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);

    return { success: true, assignmentId: result.assignmentId };
  } catch (err) {
    if (err instanceof ActionError) {
      return { success: false, code: err.code, message: err.message };
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
  | "ALREADY_ASSIGNED";

class ActionError extends Error {
  constructor(
    public readonly code: AdminActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}
