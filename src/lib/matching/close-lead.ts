import type { Prisma } from "@prisma/client";

/**
 * Ferme un lead plein : autres assignments PENDING → EXPIRED, lead → ACCEPTED.
 * À appeler dans la transaction qui vient d'accepter un assignment, depuis
 * les deux chemins d'achat (`acceptLeadAssignment` et l'auto-accept).
 *
 * @returns les `proProfileId` évincés, à notifier après le commit.
 */
export async function closeLeadIfFull(input: {
  tx: Prisma.TransactionClient;
  leadId: string;
  maxAcceptances: number;
  /** Assignment de l'acheteur courant, à ne jamais expirer. */
  keepAssignmentId: string;
}): Promise<ReadonlyArray<string>> {
  const { tx, leadId, maxAcceptances, keepAssignmentId } = input;

  const acceptedCount = await tx.leadAssignment.count({
    where: { leadId, status: "ACCEPTED" },
  });
  if (acceptedCount < maxAcceptances) return [];

  const losers = {
    leadId,
    status: "PENDING" as const,
    id: { not: keepAssignmentId },
  };

  // Lus avant l'updateMany, qui les sort du filtre PENDING.
  const otherPendings = await tx.leadAssignment.findMany({
    where: losers,
    select: { proProfileId: true },
  });
  await tx.leadAssignment.updateMany({
    where: losers,
    data: { status: "EXPIRED" },
  });
  await tx.lead.update({
    where: { id: leadId },
    data: { status: "ACCEPTED" },
  });

  return otherPendings.map((p) => p.proProfileId);
}
