import type { Prisma, WalletTxType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminTxTab =
  | "tous"
  | "recharges"
  | "achats-leads"
  | "credits-admin"
  | "debits-admin"
  | "remboursements";

export type AdminTransactionRow = {
  id: string;
  createdAt: Date;
  type: WalletTxType;
  amountCents: number;
  balanceAfterCents: number;
  description: string | null;
  stripePaymentIntentId: string | null;
  proCompanyName: string;
  proProfileId: string;
};

function buildTxWhere(tab: AdminTxTab): Prisma.WalletTransactionWhereInput {
  switch (tab) {
    case "tous":
      return {};
    case "recharges":
      return { type: "TOPUP" };
    case "achats-leads":
      return { type: "LEAD_DEBIT" };
    case "credits-admin":
      return { type: "ADMIN_CREDIT" };
    case "debits-admin":
      return { type: "ADMIN_DEBIT" };
    case "remboursements":
      return { type: "REFUND_TO_CREDIT" };
  }
}

export async function listAdminTransactions(input: {
  tab: AdminTxTab;
  limit: number;
  skip: number;
}): Promise<{ rows: AdminTransactionRow[]; total: number }> {
  const where = buildTxWhere(input.tab);

  const [txs, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: input.limit,
      skip: input.skip,
      select: {
        id: true,
        createdAt: true,
        type: true,
        amountCents: true,
        balanceAfterCents: true,
        description: true,
        stripePaymentIntentId: true,
        user: {
          select: {
            proProfile: {
              select: { id: true, companyName: true },
            },
          },
        },
      },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  const rows: AdminTransactionRow[] = txs.map((t) => ({
    id: t.id,
    createdAt: t.createdAt,
    type: t.type,
    amountCents: t.amountCents,
    balanceAfterCents: t.balanceAfterCents,
    description: t.description,
    stripePaymentIntentId: t.stripePaymentIntentId,
    proCompanyName: t.user.proProfile?.companyName ?? "—",
    proProfileId: t.user.proProfile?.id ?? "",
  }));

  return { rows, total };
}

export async function getTxTabsCounts(): Promise<Record<AdminTxTab, number>> {
  const [tous, recharges, achats, creditsAdmin, debitsAdmin, remboursements] =
    await Promise.all([
      prisma.walletTransaction.count(),
      prisma.walletTransaction.count({ where: { type: "TOPUP" } }),
      prisma.walletTransaction.count({ where: { type: "LEAD_DEBIT" } }),
      prisma.walletTransaction.count({ where: { type: "ADMIN_CREDIT" } }),
      prisma.walletTransaction.count({ where: { type: "ADMIN_DEBIT" } }),
      prisma.walletTransaction.count({ where: { type: "REFUND_TO_CREDIT" } }),
    ]);

  return {
    tous,
    recharges,
    "achats-leads": achats,
    "credits-admin": creditsAdmin,
    "debits-admin": debitsAdmin,
    remboursements,
  };
}
