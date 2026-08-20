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

// Actions admin sur Lead :
//   assignLeadGratis   — offre un lead a un pro VALIDATED gratuitement.
//   deleteLeadAsAdmin  — soft-delete d'un lead suspect (faux numero, projet
//                        absurde) AVANT achat.
//
// Wrappees avec withAuditLog (LEAD_GIFTED / LEAD_DELETED). Voir
// docs/conventions.md pour le pattern Result + AuditLog.

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
 *  2. Refuser si le pro possede deja le lead (assignment ACCEPTED)
 *  3. Creer le LeadAssignment — ou recycler celui deja en base (notifie,
 *     expire, refuse), le unique [leadId, proProfileId] interdisant un
 *     second assignment
 *  4. Si Lead etait PENDING_MATCH ou ASSIGNED, transition vers ACCEPTED
 *     (un lead "offert" devient comme un lead achete cote workflow).
 *  5. Fermer les assignments PENDING des autres pros (-> EXPIRED) : un lead
 *     offert n'est plus a vendre. Cote dashboard pro, la ligne ne disparait
 *     pas pour autant, elle passe en grise "Plus disponible" jusqu'a la fin
 *     de vie du lead.
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

            // expiresAt requis sur LeadAssignment, valeur honnetique pour
            // un lead offert ACCEPTED direct (pas de timer effectif).
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

            // Pro deja matche sur ce lead (notifie, expire faute d'achat, ou
            // ayant refuse) : on recycle sa ligne au lieu d'en creer une
            // seconde, interdite par le unique. Les traces de refus sont
            // effacees — un ACCEPTED qui garde un refusedAt fausse les vues
            // pro et les stats. radiusKmAtAssignment n'est pas touche : le
            // pro a bien ete matche par geo, contrairement a un don direct.
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
                    radiusKmAtAssignment: 0, // Pas matche par geo, admin override
                    ...giftData,
                  },
                });

            // Si lead en PENDING_MATCH ou ASSIGNED → transition vers ACCEPTED.
            if (lead.status === "PENDING_MATCH" || lead.status === "ASSIGNED") {
              await tx.lead.update({
                where: { id: leadId },
                data: { status: "ACCEPTED" },
              });
            }

            // Le lead est donne : les autres pros ne peuvent plus l'acheter.
            // Meme mecanique que l'acceptation qui remplit le lead — c'est ce
            // statut EXPIRED qui fait basculer la ligne en grise cote pro.
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

const deleteLeadSchema = z.object({
  leadId: z.string().min(1),
});

export type DeleteLeadResult =
  | { success: true }
  | {
      success: false;
      code: "INVALID_INPUT" | "LEAD_NOT_FOUND" | "ALREADY_PURCHASED" | "INTERNAL";
      message: string;
    };

/**
 * Soft-delete d'un lead suspect par l'admin. Refuse si le lead a
 * deja un assignment ACCEPTED (lead achete → on ne le supprime pas, ce
 * serait un debit deja effectue cote pro). Sinon :
 *   - Lead.deletedAt = now + status = CANCELLED (le filtre deletedAt deja en
 *     place masque le lead partout : dispos pro, cron, detail admin).
 *   - LeadAssignments PENDING → EXPIRED (coherence stats + robustesse vs
 *     requetes qui ne filtreraient pas deletedAt). Pas de notification aux
 *     pros (ils voient juste le lead disparaitre).
 * Trace via AuditLog (LEAD_DELETED).
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
          // Le lead doit disparaitre des vues pro sans attendre le polling.
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
