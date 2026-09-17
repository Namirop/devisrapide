import type { Prisma, PrismaClient } from "@prisma/client";

export type WalletTxClient = Prisma.TransactionClient | PrismaClient;

/**
 * Verrouille la ligne `ProProfile` et retourne le solde courant.
 *
 * Point de passage obligé de tout mouvement de wallet (débit comme crédit) :
 * `SELECT ... FOR UPDATE` ne sérialise que les écrivains qui le prennent, et
 * un chemin qui lirait le solde sans verrou avant de réécrire une valeur
 * absolue écraserait les mouvements concurrents (lost update).
 *
 * À appeler dans une transaction `Serializable`.
 *
 * @throws Error si le ProProfile n'existe pas.
 */
export async function lockProProfileBalance(
  tx: WalletTxClient,
  proProfileId: string,
): Promise<number> {
  // Prisma n'expose pas FOR UPDATE : requête brute, scopée à la transaction.
  const rows = await tx.$queryRaw<Array<{ walletBalanceCents: number }>>`
    SELECT "walletBalanceCents"
    FROM "ProProfile"
    WHERE "id" = ${proProfileId}
    FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new Error(`ProProfile introuvable: ${proProfileId}`);
  }
  return rows[0].walletBalanceCents;
}
