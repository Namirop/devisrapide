import type { WalletTxType } from "@prisma/client";
import { Wallet as WalletIcon } from "@phosphor-icons/react/dist/ssr";

import { formatDateTimeBE } from "@/lib/date";
import { formatPriceCents } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { WalletTransactionRow } from "@/server/queries/wallet";

const TX_TYPE_LABEL: Record<WalletTxType, string> = {
  TOPUP: "Recharge",
  LEAD_DEBIT: "Achat lead",
  ADMIN_CREDIT: "Crédit admin",
  ADMIN_DEBIT: "Débit admin",
  REFUND_TO_CREDIT: "Remboursement",
};

const TX_TYPE_SIGN: Record<WalletTxType, "credit" | "debit"> = {
  TOPUP: "credit",
  LEAD_DEBIT: "debit",
  ADMIN_CREDIT: "credit",
  ADMIN_DEBIT: "debit",
  REFUND_TO_CREDIT: "credit",
};

type Props = {
  transactions: WalletTransactionRow[];
};

export function TransactionsTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <span
          className="grid h-12 w-12 place-items-center rounded-full bg-blue-50"
          aria-hidden
        >
          <WalletIcon size={24} weight="regular" className="text-[#1e3a8a]" />
        </span>
        <p className="font-display text-[15px] font-bold text-slate-900">
          Aucune transaction pour le moment
        </p>
        <p className="text-[12.5px] text-slate-500">
          Vos achats de leads et recharges apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Type
            </th>
            <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:table-cell">
              Description
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Montant
            </th>
            <th className="hidden px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:table-cell">
              Solde après
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const sign = TX_TYPE_SIGN[t.type];
            const isCredit = sign === "credit";
            return (
              <tr
                key={t.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 text-slate-700">
                  {formatDateTimeBE(t.createdAt)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {TX_TYPE_LABEL[t.type]}
                </td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                  {t.description ?? "—"}
                </td>
                <td
                  className={cn(
                    "font-display px-4 py-3 text-right font-bold",
                    isCredit ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {isCredit ? "+" : "-"}
                  {formatPriceCents(t.amountCents)}
                </td>
                <td className="hidden px-4 py-3 text-right text-slate-700 sm:table-cell">
                  {formatPriceCents(t.balanceAfterCents)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
