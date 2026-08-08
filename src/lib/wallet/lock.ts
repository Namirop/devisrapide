import type { Prisma, PrismaClient } from "@prisma/client";

export type WalletTxClient = Prisma.TransactionClient | PrismaClient;

/**
 * Verrouille la ligne `ProProfile` et retourne le solde courant.
 *
 * C'est le point de passage unique de TOUT mouvement de wallet — debit
 * comme credit. Un `SELECT ... FOR UPDATE` ne serialise que les ecrivains
 * qui le prennent : le jour ou un seul chemin lit le solde sans ce verrou
 * puis reecrit une valeur absolue, il ecrase silencieusement les
 * mouvements concurrents des autres chemins. C'est exactement ce qui
 * arrivait a l'ajustement manuel admin, qui lisait via `findUnique` en
 * READ COMMITTED pendant qu'une acceptation de lead debitait sous verrou.
 *
 * A appeler DANS une transaction en isolation `Serializable` : le verrou
 * protege du lost update, l'isolation protege des anomalies de lecture
 * sur le comptage qui l'accompagne.
 *
 * @throws Error si le ProProfile n'existe pas.
 */
export async function lockProProfileBalance(
  tx: WalletTxClient,
  proProfileId: string,
): Promise<number> {
  // Prisma ne supporte pas nativement FOR UPDATE → raw query scopee a la tx.
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
