"use server";

import { LeadFollowupStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProSession, UnauthorizedError } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Server Action pour qualifier le devenir d'un lead apres acceptation par
// le pro. Consomme par le dashboard pro (/dashboard/mes-demandes).
//
// Separee de lead-assignment.ts (accept / refuse) : la qualification est un
// cycle distinct (LeadFollowupStatus) qui ne touche ni au wallet ni au
// statut de l'assignment.
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
