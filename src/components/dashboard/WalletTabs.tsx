"use client";

import { useState } from "react";
import Link from "next/link";
import type { WalletTxType } from "@prisma/client";
import {
  CaretLeft,
  CaretRight,
  Sparkle,
  Wallet as WalletIcon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/stats";
import type { WalletPack, WalletTransactionRow } from "@/server/queries/wallet";

type Props = {
  transactions: WalletTransactionRow[];
  totalCount: number;
  packs: WalletPack[];
  page: number;
  totalPages: number;
};

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

/**
 * Wallet tabs (Client Component) : Historique / Packs disponibles.
 * Pill tabs style cohérent avec le pattern home + /leads. State local
 * pour switch d'onglet sans roundtrip.
 *
 * Note : la pagination historique reste server-side via ?page=, donc
 * change d'onglet ne reset PAS la pagination historique (volontaire).
 */
export function WalletTabs({
  transactions,
  totalCount,
  packs,
  page,
  totalPages,
}: Props) {
  const [active, setActive] = useState<"history" | "packs">("history");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <PillTab
          active={active === "history"}
          onClick={() => setActive("history")}
        >
          Historique ({totalCount})
        </PillTab>
        <PillTab
          active={active === "packs"}
          onClick={() => setActive("packs")}
        >
          Packs disponibles
        </PillTab>
      </div>

      {active === "history" ? (
        <>
          <TransactionsTable transactions={transactions} />
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} />
          )}
        </>
      ) : (
        <PacksGrid packs={packs} />
      )}
    </div>
  );
}

function PillTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-2 pt-1 text-[12.5px] font-medium transition-colors",
        active ? "text-slate-900" : "text-slate-600 hover:text-slate-900",
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "h-1 w-1 rounded-full transition-colors",
          active ? "bg-[#ea580c]" : "bg-transparent",
        )}
        aria-hidden
      />
    </button>
  );
}

function TransactionsTable({
  transactions,
}: {
  transactions: WalletTransactionRow[];
}) {
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
                  {t.createdAt.toLocaleString("fr-BE", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
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

function PacksGrid({ packs }: { packs: WalletPack[] }) {
  if (packs.length === 0) {
    return (
      <p className="text-[13px] text-slate-500">
        Configuration des packs non disponible. Contactez le support.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {packs.map((p) => (
        <div
          key={p.id}
          className={cn(
            "relative rounded-lg border bg-white p-5",
            p.featured ? "border-[#1e3a8a]" : "border-slate-200",
          )}
        >
          {p.featured && (
            <span
              className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <Sparkle size={12} weight="bold" />
              Populaire
            </span>
          )}
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            {p.label}
          </h3>
          <p className="font-display mt-2 text-[40px] font-bold leading-none tracking-tight text-slate-900">
            {p.priceEur} €
          </p>
          <p className="mt-3 text-[13px] text-slate-600">
            {p.creditEur} crédits
            {p.bonusEur > 0 && (
              <span className="ml-1 font-semibold text-emerald-600">
                +{p.bonusEur}€ bonus
              </span>
            )}
          </p>
          <div className="group relative mt-5">
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-500"
            >
              Choisir ce pack
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white group-hover:block"
            >
              Bientôt disponible
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const prevHref = page > 1 ? `/dashboard/wallet?page=${page - 1}` : null;
  const nextHref =
    page < totalPages ? `/dashboard/wallet?page=${page + 1}` : null;

  return (
    <nav className="mt-4 flex items-center justify-center gap-2">
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}
