"use server";

import { LeadFollowupStatus } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
