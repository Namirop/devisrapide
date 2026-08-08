import type { WalletMovementResult } from "./credit";
import { lockProProfileBalance, type WalletTxClient } from "./lock";

/**
 * Seuil "wallet faible" en centimes. Push notification
 * envoye au pro UNIQUEMENT au franchissement (balanceBefore >= seuil ET
 * balanceAfter < seuil), pas a chaque debit subsequent en dessous.
 *
 * V1 = 50€ hardcode. V2 = configurable par pro via ProProfile (slider
 * dans /dashboard/profil, tracked v2-roadmap).
 */
export const WALLET_LOW_BALANCE_THRESHOLD_CENTS = 5000;

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

/**
 * Resultat d'un debit reussi. Inclut les soldes avant/apres pour
 * permettre aux appelants de detecter un franchissement de seuil
 * (push "wallet faible" envoye uniquement au franchissement,
 * pas a chaque debit en dessous du seuil).
 */
export type DebitWalletResult = WalletMovementResult;

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
 *   const { transactionId, balanceBeforeCents, balanceAfterCents } =
 *     await prisma.$transaction(
 *       async (tx) =>
 *         debitWalletForLead({
 *           tx,
 *           proProfileId: "cuid_pro",
 *           proUserId: "cuid_user",
 *           amountCents: 2500,
 *           leadAssignmentId: "cuid_assignment",
 *         }),
 *       { isolationLevel: "Serializable" },
 *     );
 *
 * @returns { transactionId, balanceBeforeCents, balanceAfterCents }
 * @throws  WalletInsufficientFundsError si solde insuffisant
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

  // 1. Lock + read current balance (cf. lib/wallet/lock.ts).
  const balanceBeforeCents = await lockProProfileBalance(tx, proProfileId);

  // 2. Check solde.
  if (balanceBeforeCents < amountCents) {
    throw new WalletInsufficientFundsError(
      proProfileId,
      amountCents,
      balanceBeforeCents,
    );
  }

  // 3. Decrement.
  const balanceAfterCents = balanceBeforeCents - amountCents;
  await tx.proProfile.update({
    where: { id: proProfileId },
    data: { walletBalanceCents: balanceAfterCents },
  });

  // 4. Log immuable.
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

  // 5. Trace inverse sur l'assignment.
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
 * Debit manuel decide par l'admin (`ADMIN_DEBIT`), sous le meme verrou que
 * le debit d'acceptation de lead. Pas de `leadAssignmentId` : ce mouvement
 * ne se rattache a aucun achat.
 *
 * A appeler DANS une transaction `Serializable`.
 *
 * @throws WalletInsufficientFundsError si le solde verrouille est trop bas.
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
