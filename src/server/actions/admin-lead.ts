"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { afterResponse } from "@/lib/after-response";
import { withAuditLog } from "@/lib/audit/log";
import { requireAdminSession } from "@/lib/auth-guards";
import { urgencyLabel } from "@/lib/email/helpers";
import { sendLeadGiftedProEmail } from "@/lib/email/sender";
import { ActionError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { sendPushToProfile } from "@/lib/push/send";

// Actions admin sur les leads, tracées via withAuditLog (pattern Result +
// AuditLog : docs/conventions.md).

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
 * Offre un lead à un pro VALIDATED : assignment ACCEPTED à 0 €, marqué
 * adminGifted, sans débit wallet. Dans une seule transaction, le lead et le
 * pro sont relus (anti-race), le lead passe en ACCEPTED comme après un achat
 * et les assignments PENDING des autres pros expirent : il n'est plus à vendre.
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

            const existing = await tx.leadAssignment.findUnique({
              where: {
                leadId_proProfileId: { leadId, proProfileId },
              },
              select: { id: true, status: true },
            });
            if (existing?.status === "ACCEPTED") {
              throw new ActionError(
                "ALREADY_ASSIGNED",
                "Ce pro possède déjà ce lead : rien à offrir.",
              );
            }

            // expiresAt est obligatoire mais sans effet sur un ACCEPTED.
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const giftData = {
              status: "ACCEPTED" as const,
              priceCents: 0,
              isExclusive: lead.isExclusive,
              acceptedAt: new Date(),
              expiresAt,
              adminGifted: true,
              adminGiftedBy: adminUserId,
              adminGiftNote: adminNote ?? null,
            };

            // Pro déjà matché (notifié, expiré ou ayant refusé) : l'unique
            // [leadId, proProfileId] impose de recycler sa ligne. Les traces
            // de refus sont effacées (un ACCEPTED avec refusedAt fausserait
            // vues et stats) ; radiusKmAtAssignment garde le matching géo.
            const assignment = existing
              ? await tx.leadAssignment.update({
                  where: { id: existing.id },
                  data: { ...giftData, refusedAt: null, refusalReason: null },
                })
              : await tx.leadAssignment.create({
                  data: {
                    leadId,
                    proProfileId,
                    proUserId: pro.userId,
                    radiusKmAtAssignment: 0, // Don direct, hors matching géo
                    ...giftData,
                  },
                });

            if (lead.status === "PENDING_MATCH" || lead.status === "ASSIGNED") {
              await tx.lead.update({
                where: { id: leadId },
                data: { status: "ACCEPTED" },
              });
            }

            // Comme pour un lead complet : EXPIRED grise la ligne côté pro.
            await tx.leadAssignment.updateMany({
              where: {
                leadId,
                status: "PENDING",
                id: { not: assignment.id },
              },
              data: { status: "EXPIRED" },
            });

            return { assignmentId: assignment.id };
          });

          // Notifications après commit, hors transaction.
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

          if (emailData) {
            const gifted = emailData;
            afterResponse("push/leadGifted", () =>
              sendPushToProfile(proProfileId, {
                title: "Lead offert",
                body: `L'équipe DevisRapide vous a offert un lead : ${gifted.subCategory.category.name} à ${gifted.city}.`,
                url: "/dashboard/leads",
                tag: `lead-gifted-${leadId}`,
              }),
            );
          }

          revalidatePath("/admin");
          revalidatePath("/admin/leads");
          revalidatePath(`/admin/leads/${leadId}`);
          // Pages du pro destinataire, où le lead offert doit apparaître.
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

const deleteLeadSchema = z.object({
  leadId: z.string().min(1),
});

export type DeleteLeadResult =
  | { success: true }
  | {
      success: false;
      code:
        "INVALID_INPUT" | "LEAD_NOT_FOUND" | "ALREADY_PURCHASED" | "INTERNAL";
      message: string;
    };

/**
 * Soft-delete d'un lead suspect (deletedAt + CANCELLED), refusé dès qu'un pro
 * l'a acheté. Les assignments PENDING passent en EXPIRED pour les stats et les
 * requêtes qui ne filtreraient pas deletedAt. Aucune notification aux pros.
 */
export async function deleteLeadAsAdmin(
  rawInput: unknown,
): Promise<DeleteLeadResult> {
  const { userId: adminUserId } = await requireAdminSession();

  const parsed = deleteLeadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Identifiant de lead invalide.",
    };
  }
  const { leadId } = parsed.data;

  try {
    return await withAuditLog<DeleteLeadResult>(
      {
        action: "LEAD_DELETED",
        actorId: adminUserId,
        target: { type: "Lead", id: leadId },
        inputSummary: { leadId },
        resultSummary: (r) => ({
          success: r.success,
          code: r.success ? null : r.code,
        }),
      },
      async (): Promise<DeleteLeadResult> => {
        try {
          await prisma.$transaction(async (tx) => {
            const lead = await tx.lead.findUnique({
              where: { id: leadId },
              select: {
                id: true,
                deletedAt: true,
                assignments: { select: { status: true } },
              },
            });
            if (!lead || lead.deletedAt) {
              throw new ActionError(
                "LEAD_NOT_FOUND",
                "Lead introuvable ou déjà supprimé.",
              );
            }
            const hasAccepted = lead.assignments.some(
              (a) => a.status === "ACCEPTED",
            );
            if (hasAccepted) {
              throw new ActionError(
                "ALREADY_PURCHASED",
                "Ce lead a déjà été acheté par un pro : suppression impossible.",
              );
            }

            await tx.lead.update({
              where: { id: leadId },
              data: { deletedAt: new Date(), status: "CANCELLED" },
            });
            await tx.leadAssignment.updateMany({
              where: { leadId, status: "PENDING" },
              data: { status: "EXPIRED" },
            });
          });

          revalidatePath("/admin");
          revalidatePath("/admin/leads");
          revalidatePath(`/admin/leads/${leadId}`);
          // Retire le lead des pages pro déjà rendues.
          revalidatePath("/dashboard");
          revalidatePath("/dashboard/leads");

          return { success: true };
        } catch (err) {
          if (err instanceof ActionError) {
            return {
              success: false,
              code: err.code as "LEAD_NOT_FOUND" | "ALREADY_PURCHASED",
              message: err.message,
            };
          }
          throw err;
        }
      },
    );
  } catch (err) {
    console.error("[admin/deleteLeadAsAdmin] failed", {
      adminUserId,
      leadId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message: "Erreur interne. Réessayez.",
    };
  }
}
