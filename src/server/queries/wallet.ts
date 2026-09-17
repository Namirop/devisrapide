import type { WalletTxType } from "@prisma/client";

import { getAppConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export type WalletTransactionRow = {
  id: string;
  createdAt: Date;
  type: WalletTxType;
  description: string | null;
  amountCents: number;
  balanceAfterCents: number;
};

export async function getWalletTransactions(input: {
  userId: string;
  limit?: number;
  skip?: number;
}): Promise<WalletTransactionRow[]> {
  return prisma.walletTransaction.findMany({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
    take: input.limit,
    skip: input.skip,
    select: {
      id: true,
      createdAt: true,
      type: true,
      description: true,
      amountCents: true,
      balanceAfterCents: true,
    },
  });
}

export async function countWalletTransactions(userId: string): Promise<number> {
  return prisma.walletTransaction.count({ where: { userId } });
}

export type WalletPack = {
  id: string;
  priceEur: number;
  creditEur: number;
  bonusEur: number;
  label: string;
  featured?: boolean;
};

/**
 * Packs de recharge (AppConfig.WALLET_PACKS), filtrés sur une structure
 * minimale (id, priceEur, creditEur, label). Config absente ou illisible :
 * tableau vide, et l'UI signale que les packs sont indisponibles.
 */
export async function getWalletPacks(): Promise<WalletPack[]> {
  try {
    const raw = await getAppConfig("WALLET_PACKS", "json");
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (p): p is WalletPack =>
        p !== null &&
        typeof p === "object" &&
        typeof (p as WalletPack).id === "string" &&
        typeof (p as WalletPack).priceEur === "number" &&
        typeof (p as WalletPack).creditEur === "number" &&
        typeof (p as WalletPack).label === "string",
    );
  } catch {
    return [];
  }
}
