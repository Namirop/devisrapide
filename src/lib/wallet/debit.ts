import type { WalletMovementResult } from "./credit";
import { lockProProfileBalance, type WalletTxClient } from "./lock";

/**
 * Seuil « wallet faible » en centimes. La notification part uniquement au
 * franchissement (avant >= seuil, après < seuil), pas à chaque débit en dessous.
 */
export const WALLET_LOW_BALANCE_THRESHOLD_CENTS = 5000;

/** Solde insuffisant : condition métier, à distinguer d'une panne BDD. */
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

export type DebitWalletResult = WalletMovementResult;

/**
 * Débite le wallet d'un pro à l'acceptation d'un lead. À appeler dans une
 * transaction `Serializable` : le verrou sur `ProProfile` empêche deux
 * acceptations simultanées de passer chacune le contrôle de solde. Journalise
 * un `WalletTransaction` LEAD_DEBIT immuable, relié à l'assignment.
 *
 * @throws WalletInsufficientFundsError si le solde est insuffisant.
 */
export async function debitWalletForLead(input: {
  tx: WalletTxClient;
  proProfileId: string;
  proUserId: string;
  amountCents: number;
  leadAssignmentId: string;
  description?: string;
}): Promise<DebitWalletResult> {
  const { tx, proProfileId, proUserId, amountCents, leadAssignmentId } = input;

  const balanceBeforeCents = await lockProProfileBalance(tx, proProfileId);

  if (balanceBeforeCents < amountCents) {
    throw new WalletInsufficientFundsError(
      proProfileId,
      amountCents,
      balanceBeforeCents,
    );
  }

  // Valeur absolue sûre : le solde a été lu sous verrou.
  const balanceAfterCents = balanceBeforeCents - amountCents;
  await tx.proProfile.update({
    where: { id: proProfileId },
    data: { walletBalanceCents: balanceAfterCents },
  });

  const transaction = await tx.walletTransaction.create({
    data: {
      userId: proUserId,
      type: "LEAD_DEBIT",
      amountCents,
      balanceAfterCents,
      leadAssignmentId,
      description: input.description ?? "Acceptation lead",
    },
    select: { id: true },
  });

  await tx.leadAssignment.update({
    where: { id: leadAssignmentId },
    data: { walletTransactionId: transaction.id },
  });

  return {
    transactionId: transaction.id,
    balanceBeforeCents,
    balanceAfterCents,
  };
}

/**
 * Débit manuel admin (`ADMIN_DEBIT`), sous le même verrou que le débit de
 * lead, sans assignment rattaché. À appeler dans une transaction `Serializable`.
 *
 * @throws WalletInsufficientFundsError si le solde verrouillé est trop bas.
 */
export async function debitWalletManual(input: {
  tx: WalletTxClient;
  proProfileId: string;
  proUserId: string;
  amountCents: number;
  reason: string;
  adminActorId: string;
}): Promise<DebitWalletResult> {
  const { tx, proProfileId, proUserId, amountCents, reason, adminActorId } =
    input;

  const balanceBeforeCents = await lockProProfileBalance(tx, proProfileId);
  if (balanceBeforeCents < amountCents) {
    throw new WalletInsufficientFundsError(
      proProfileId,
      amountCents,
      balanceBeforeCents,
    );
  }

  const balanceAfterCents = balanceBeforeCents - amountCents;
  await tx.proProfile.update({
    where: { id: proProfileId },
    data: { walletBalanceCents: balanceAfterCents },
  });

  const transaction = await tx.walletTransaction.create({
    data: {
      userId: proUserId,
      type: "ADMIN_DEBIT",
      amountCents,
      balanceAfterCents,
      description: reason,
      adminReason: reason,
      adminActorId,
    },
    select: { id: true },
  });

  return {
    transactionId: transaction.id,
    balanceBeforeCents,
    balanceAfterCents,
  };
}
