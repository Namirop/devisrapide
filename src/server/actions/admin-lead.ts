"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { urgencyLabel } from "@/lib/email/helpers";
import { sendLeadGiftedProEmail } from "@/lib/email/sender";
import { ActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

// Actions admin sur Lead :
//   assignLeadGratis — offre un lead a un pro VALIDATED gratuitement.
//
// Wrappee avec withAuditLog (action LEAD_GIFTED). Voir docs/conventions.md
// (Sprint 5b) pour le pattern Result + AuditLog.

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
 * adminGiftedBy=adminUserId. Pas de debit wallet.
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
    return await withAuditLog<AssignLeadGratisResult>(
      {
        action: "LEAD_GIFTED",
        actorId: adminUserId,
        target: { type: "Lead", id: leadId },
        inputSummary: {
          leadId,
          proProfileId,
          hasAdminNote: Boolean(adminNote),
        },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
          assignmentId: r.success ? r.assignmentId : null,
        }),
      },
      async (): Promise<AssignLeadGratisResult> => {
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

            // expiresAt requis sur LeadAssignment, valeur honnetique pour
            // un lead offert ACCEPTED direct (pas de timer effectif).
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
                adminGiftNote: adminNote ?? null,
              },
            });

            // Si lead en PENDING_MATCH ou ASSIGNED → transition vers ACCEPTED.
            if (lead.status === "PENDING_MATCH" || lead.status === "ASSIGNED") {
              await tx.lead.update({
                where: { id: leadId },
                data: { status: "ACCEPTED" },
              });
            }

            return { assignmentId: assignment.id };
          });

          // Send "Lead offert" email post-transaction. Re-fetch les donnees
          // completes du lead + pro user pour construire le payload email.
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
              adminNote: adminNote ?? null,
              proProfileId,
              leadId,
            });
          }

          revalidatePath("/admin");
          revalidatePath("/admin/leads");
          revalidatePath(`/admin/leads/${leadId}`);
          // Le pro qui recoit le lead doit voir l'apparition dans son
          // dashboard sans attendre le polling SWR 30s.
          revalidatePath("/dashboard");
          revalidatePath("/dashboard/mes-demandes");

          return { success: true, assignmentId: result.assignmentId };
        } catch (err) {
          if (err instanceof ActionError) {
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
          throw err;
        }
      },
    );
  } catch (err) {
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
