import { lockProProfileBalance, type WalletTxClient } from "./lock";

/**
 * Resultat d'un mouvement de wallet. Identique en credit et en debit pour
 * que les appelants puissent detecter un franchissement de seuil sans se
 * soucier du sens du mouvement.
 */
export type WalletMovementResult = {
  transactionId: string;
  balanceBeforeCents: number;
  balanceAfterCents: number;
};

/**
 * Credite le wallet d'un pro et journalise le mouvement, sous verrou.
 *
 * Utilise par l'ajustement manuel admin (`ADMIN_CREDIT`). La recharge
 * Stripe ne passe PAS par ici : elle ecrit avec `{ increment }`, atomique
 * cote SQL, et son idempotence repose sur `StripeWebhookEvent` — la
 * reconstruire autour d'un verrou n'apporterait rien et allongerait la
 * transaction du webhook.
 *
 * A appeler DANS une transaction `Serializable` (cf. `lockProProfileBalance`).
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
