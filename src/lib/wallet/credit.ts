import { lockProProfileBalance, type WalletTxClient } from "./lock";

/** Résultat commun crédit/débit : permet de détecter un franchissement de seuil. */
export type WalletMovementResult = {
  transactionId: string;
  balanceBeforeCents: number;
  balanceAfterCents: number;
};

/**
 * Crédit manuel admin (`ADMIN_CREDIT`), sous verrou, dans une transaction
 * `Serializable`. La recharge Stripe ne passe pas par ici : `{ increment }`
 * est atomique côté SQL et l'idempotence repose sur `StripeWebhookEvent`,
 * un verrou n'y ajouterait que de la latence.
 */
export async function creditWallet(input: {
  tx: WalletTxClient;
  proProfileId: string;
  proUserId: string;
  amountCents: number;
  reason: string;
  adminActorId: string;
}): Promise<WalletMovementResult> {
  const { tx, proProfileId, proUserId, amountCents, reason, adminActorId } =
    input;

  const balanceBeforeCents = await lockProProfileBalance(tx, proProfileId);
  const balanceAfterCents = balanceBeforeCents + amountCents;

  await tx.proProfile.update({
    where: { id: proProfileId },
    data: { walletBalanceCents: balanceAfterCents },
  });

  const transaction = await tx.walletTransaction.create({
    data: {
      userId: proUserId,
      type: "ADMIN_CREDIT",
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
