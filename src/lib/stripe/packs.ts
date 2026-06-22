import { getWalletPacks, type WalletPack } from "@/server/queries/wallet";

/**
 * Recupere un pack de recharge par son id, depuis AppConfig.WALLET_PACKS.
 * Retourne null si introuvable (cle invalide, pack desactive a venir,
 * ou config cassee).
 *
 * Utilise principalement par createCheckoutSession pour valider que le
 * packId envoye par le client correspond bien a un pack actif, puis
 * extraire priceEur / creditEur pour construire la Stripe Checkout Session.
 */
export async function getPackById(
  packId: string,
): Promise<WalletPack | null> {
  const packs = await getWalletPacks();
  return packs.find((p) => p.id === packId) ?? null;
}
