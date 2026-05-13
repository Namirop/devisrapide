import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Erreur typee levee lorsqu'un debit ne peut etre realise faute de solde
 * suffisant. Permet aux consommateurs (Server Actions, matching auto-accept)
 * de distinguer cette condition metier d'une vraie panne BDD.
 */
export class WalletInsufficientFundsError extends Error {
  constructor(
    public readonly proProfileId: string,
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `Wallet insuffisant pour proProfile=${proProfileId} (requis ${required}c, dispo ${available}c)`,
    );
    this.name = "WalletInsufficientFundsError";
  }
}

type TxClient = Prisma.TransactionClient | PrismaClient;

/**
 * Debite le wallet d'un pro pour l'acceptation d'un lead, de maniere
 * atomique. Strategie :
 *
 * 1. Lock `SELECT ... FOR UPDATE` sur la ligne `ProProfile` pour serialiser
 *    les debits concurrents (deux acceptations simultanees ne peuvent pas
 *    chacune passer le check de solde).
 * 2. Verifie le solde courant >= `amountCents` ; sinon throw
 *    `WalletInsufficientFundsError`.
 * 3. Decrement atomique du solde.
 * 4. Insertion immuable d'un `WalletTransaction` (type LEAD_DEBIT) trace
 *    avec le solde apres operation, le `leadAssignmentId` source, et le
 *    montant.
 * 5. Mise a jour de `LeadAssignment.walletTransactionId` pour la trace
 *    inverse.
 *
 * @example
 *   await prisma.$transaction(
 *     async (tx) => {
 *       await debitWalletForLead({
 *         tx,
 *         proProfileId: "cuid_pro",
 *         proUserId: "cuid_user",
 *         amountCents: 2500,
 *         leadAssignmentId: "cuid_assignment",
 *       });
 *       await tx.leadAssignment.update({ ... });
 *     },
 *     { isolationLevel: "Serializable" },
 *   );
 *
 * @returns id du WalletTransaction cree
 * @throws  WalletInsufficientFundsError si solde insuffisant
 */
export async function debitWalletForLead(input: {
  tx: TxClient;
  proProfileId: string;
  proUserId: string;
  amountCents: number;
  leadAssignmentId: string;
  description?: string;
}): Promise<string> {
  const { tx, proProfileId, proUserId, amountCents, leadAssignmentId } = input;

  // 1. Lock + read current balance.
  // Prisma ne supporte pas nativement FOR UPDATE → raw query scoped to tx.
  const rows = await tx.$queryRaw<Array<{ walletBalanceCents: number }>>`
    SELECT "walletBalanceCents"
    FROM "ProProfile"
    WHERE "id" = ${proProfileId}
    FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new Error(`ProProfile introuvable: ${proProfileId}`);
  }
  const currentBalance = rows[0].walletBalanceCents;

  // 2. Check solde.
  if (currentBalance < amountCents) {
    throw new WalletInsufficientFundsError(
      proProfileId,
      amountCents,
      currentBalance,
    );
  }

  // 3. Decrement.
  const newBalance = currentBalance - amountCents;
  await tx.proProfile.update({
    where: { id: proProfileId },
    data: { walletBalanceCents: newBalance },
  });

  // 4. Log immuable.
  const transaction = await tx.walletTransaction.create({
    data: {
      userId: proUserId,
      type: "LEAD_DEBIT",
      amountCents,
      balanceAfterCents: newBalance,
      leadAssignmentId,
      description: input.description ?? "Acceptation lead",
    },
    select: { id: true },
  });

  // 5. Trace inverse sur l'assignment.
  await tx.leadAssignment.update({
    where: { id: leadAssignmentId },
    data: { walletTransactionId: transaction.id },
  });

  return transaction.id;
}
