import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { WalletTxType } from "@prisma/client";

import { AdminTransactionsTabs } from "@/components/admin/transactions/AdminTransactionsTabs";
import { requireAdminSession } from "@/lib/auth-guards";
import { formatDateTimeBE } from "@/lib/date";
import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/stats";
import {
  getTxTabsCounts,
  listAdminTransactions,
  type AdminTxTab,
} from "@/server/queries/admin-transactions";

const PAGE_SIZE = 50;
const VALID_TABS: ReadonlyArray<AdminTxTab> = [
  "tous",
  "recharges",
  "achats-leads",
  "credits-admin",
  "debits-admin",
  "remboursements",
];

const TX_TYPE_LABEL: Record<WalletTxType, string> = {
  TOPUP: "Recharge",
  LEAD_DEBIT: "Achat lead",
  ADMIN_CREDIT: "Crédit admin",
  ADMIN_DEBIT: "Débit admin",
  REFUND_TO_CREDIT: "Remboursement",
};

const TX_TYPE_BADGE: Record<WalletTxType, string> = {
  TOPUP: "bg-emerald-50 text-emerald-700",
  LEAD_DEBIT: "bg-rose-50 text-rose-700",
  ADMIN_CREDIT: "bg-blue-50 text-[#1e3a8a]",
  ADMIN_DEBIT: "bg-orange-50 text-[#ea580c]",
  REFUND_TO_CREDIT: "bg-slate-100 text-slate-700",
};

const TX_TYPE_SIGN: Record<WalletTxType, "credit" | "debit"> = {
  TOPUP: "credit",
  LEAD_DEBIT: "debit",
  ADMIN_CREDIT: "credit",
  ADMIN_DEBIT: "debit",
  REFUND_TO_CREDIT: "credit",
};

type SearchParams = Promise<{ type?: string; page?: string }>;

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminSession();
  const sp = await searchParams;
  const tab: AdminTxTab = VALID_TABS.includes(sp.type as AdminTxTab)
    ? (sp.type as AdminTxTab)
    : "tous";
  const page = Math.max(1, Number(sp.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [{ rows, total }, counts] = await Promise.all([
    listAdminTransactions({ tab, limit: PAGE_SIZE, skip }),
    getTxTabsCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Transactions wallet
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          {counts.tous} transaction{counts.tous > 1 ? "s" : ""} au total
          (tous types confondus, tous pros).
        </p>
      </header>

      <AdminTransactionsTabs
        tabs={[
          { value: "tous", label: "Toutes", count: counts.tous },
          { value: "recharges", label: "Recharges", count: counts.recharges },
          {
            value: "achats-leads",
            label: "Achats leads",
            count: counts["achats-leads"],
          },
          {
            value: "credits-admin",
            label: "Crédits admin",
            count: counts["credits-admin"],
          },
          {
            value: "debits-admin",
            label: "Débits admin",
            count: counts["debits-admin"],
          },
          {
            value: "remboursements",
            label: "Remboursements",
            count: counts.remboursements,
          },
        ]}
      />

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-slate-500">
            Aucune transaction dans cet onglet.
          </div>
        ) : (
          <>
            {/* Mobile : cards stackees. Date + pro + montant en une row,
                badge type en dessous. Pas de scroll horizontal. */}
            <ul className="flex flex-col divide-y divide-slate-100 md:hidden">
              {rows.map((tx) => {
                const sign = TX_TYPE_SIGN[tx.type];
                const isCredit = sign === "credit";
                return (
                  <li key={tx.id} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-slate-500">
                          {formatDateTimeBE(tx.createdAt)}
                        </div>
                        <div className="mt-0.5 truncate text-[13.5px]">
                          {tx.proProfileId ? (
                            <Link
                              href={`/admin/professionnels/${tx.proProfileId}`}
                              className="font-medium text-[#1e3a8a] hover:underline"
                            >
                              {tx.proCompanyName}
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "font-display whitespace-nowrap text-right text-[14px] font-bold",
                          isCredit ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {isCredit ? "+" : "-"}
                        {formatPriceCents(tx.amountCents)}
                      </div>
                    </div>
                    <div>
                      <span
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
                          TX_TYPE_BADGE[tx.type],
                        )}
                      >
                        {TX_TYPE_LABEL[tx.type]}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop : table inchangee. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Pro
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Type
                    </th>
                    <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 md:table-cell">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Montant
                    </th>
                    <th className="hidden px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 lg:table-cell">
                      Solde après
                    </th>
                    <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 xl:table-cell">
                      Réf. Stripe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((tx) => {
                    const sign = TX_TYPE_SIGN[tx.type];
                    const isCredit = sign === "credit";
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-700">
                          {formatDateTimeBE(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.proProfileId ? (
                            <Link
                              href={`/admin/professionnels/${tx.proProfileId}`}
                              className="font-medium text-[#1e3a8a] hover:underline"
                            >
                              {tx.proCompanyName}
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
                              TX_TYPE_BADGE[tx.type],
                            )}
                          >
                            {TX_TYPE_LABEL[tx.type]}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                          {tx.description ?? "—"}
                        </td>
                        <td
                          className={cn(
                            "font-display px-4 py-3 text-right font-bold",
                            isCredit ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {isCredit ? "+" : "-"}
                          {formatPriceCents(tx.amountCents)}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-slate-700 lg:table-cell">
                          {formatPriceCents(tx.balanceAfterCents)}
                        </td>
                        <td className="hidden px-4 py-3 font-mono text-[11px] text-slate-500 xl:table-cell">
                          {tx.stripePaymentIntentId ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-5 py-3">
            <Pagination tab={tab} page={page} totalPages={totalPages} />
          </div>
        )}
      </section>
    </main>
  );
}

function Pagination({
  tab,
  page,
  totalPages,
}: {
  tab: AdminTxTab;
  page: number;
  totalPages: number;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (tab !== "tous") params.set("type", tab);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/transactions${qs ? `?${qs}` : ""}`;
  };
  const prevHref = page > 1 ? buildHref(page - 1) : null;
  const nextHref = page < totalPages ? buildHref(page + 1) : null;

  return (
    <nav className="flex items-center justify-center gap-2">
      <PageButton href={prevHref} aria="Page précédente">
        <CaretLeft size={14} weight="bold" />
      </PageButton>
      <span className="text-[13px] text-slate-600">
        Page {page} / {totalPages}
      </span>
      <PageButton href={nextHref} aria="Page suivante">
        <CaretRight size={14} weight="bold" />
      </PageButton>
    </nav>
  );
}

function PageButton({
  href,
  aria,
  children,
}: {
  href: string | null;
  aria: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span
        aria-hidden
        className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 text-slate-300"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={aria}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors",
        "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      {children}
    </Link>
  );
}
