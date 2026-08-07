import type { Prisma } from "@prisma/client";

/**
 * Ferme un lead qui vient d'atteindre son plafond d'acceptations : les
 * assignments encore PENDING passent EXPIRED et le Lead passe ACCEPTED.
 *
 * A appeler DANS la transaction qui vient de basculer un assignment en
 * ACCEPTED, apres l'update/create — le comptage porte donc sur un etat qui
 * inclut deja le nouvel acheteur.
 *
 * Les DEUX chemins d'achat doivent l'appeler :
 *   - `acceptLeadAssignment` : achat manuel depuis le dashboard pro
 *   - `assignLeadToPros`     : auto-accept au moment de l'assignation
 *
 * Le second l'ignorait, et un lead rempli uniquement par des auto-accepts
 * restait `PENDING_MATCH` avec des assignments PENDING encore affiches
 * "achetables" chez les pros perdants (qui se prenaient un LEAD_FULL au
 * clic). Le cron leur poussait meme un rappel "bientot expire" avant de
 * classer le lead EXPIRED a 72h — alors qu'il avait ete vendu.
 *
 * @returns les `proProfileId` dont le PENDING vient d'etre ferme, pour le
 *          push "lead plus disponible" a envoyer APRES le commit. Tableau
 *          vide tant que le lead n'est pas plein.
 */
export async function closeLeadIfFull(input: {
  tx: Prisma.TransactionClient;
  leadId: string;
  maxAcceptances: number;
  /** L'assignment de l'acheteur courant, a ne jamais expirer. */
  keepAssignmentId: string;
}): Promise<ReadonlyArray<string>> {
  const { tx, leadId, maxAcceptances, keepAssignmentId } = input;

  const acceptedCount = await tx.leadAssignment.count({
    where: { leadId, status: "ACCEPTED" },
  });
  if (acceptedCount < maxAcceptances) return [];

  const losers = { leadId, status: "PENDING" as const, id: { not: keepAssignmentId } };

  // Capture les destinataires AVANT l'updateMany : apres, ils ne sont
  // plus PENDING et le filtre ne les retrouverait pas.
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
