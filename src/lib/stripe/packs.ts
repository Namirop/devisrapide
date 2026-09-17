import { getWalletPacks, type WalletPack } from "@/server/queries/wallet";

/**
 * Pack de recharge par id (`AppConfig.WALLET_PACKS`), ou null. Source de
 * vérité des montants : ni le `packId` reçu du navigateur ni les metadata
 * Stripe ne sont crus sur parole (checkout et webhook).
 */
export async function getPackById(packId: string): Promise<WalletPack | null> {
  const packs = await getWalletPacks();
  return packs.find((p) => p.id === packId) ?? null;
}
