import Link from "next/link";
import type { WalletTxType } from "@prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";
import { cn } from "@/lib/utils";
import {
  countWalletTransactions,
  getWalletPacks,
  getWalletTransactions,
} from "@/server/queries/wallet";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

export default async function WalletPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId, proProfileId } = await requireProSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [profile, transactions, totalCount, packs] = await Promise.all([
    prisma.proProfile.findUnique({
      where: { id: proProfileId },
      select: { walletBalanceCents: true },
    }),
    getWalletTransactions({ userId, limit: PAGE_SIZE, skip }),
    countWalletTransactions(userId),
    getWalletPacks(),
  ]);

  const balance = profile?.walletBalanceCents ?? 0;
  const credits = Math.floor(balance / 100);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 lg:text-[30px]">
          Wallet & Crédits
        </h1>
        <p className="mt-1 text-[14px] text-slate-600">
          Gérez votre solde de crédits et consultez votre historique de
          transactions.
        </p>
      </header>

      {/* Solde courant + CTA recharge disabled V1 */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
              Solde actuel
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-[36px] font-bold leading-none tracking-tight text-slate-900">
                {formatPriceCents(balance)}
              </span>
              <span className="text-[13px] text-slate-500">
                {credits} crédit{credits > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="group relative">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md bg-slate-200 px-5 py-2.5 text-[14px] font-semibold text-slate-500"
            >
              Recharger mon wallet
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute right-0 top-full mt-2 hidden whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white group-hover:block"
            >
              Bientôt disponible — recharge sécurisée via Stripe
            </span>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <Tabs defaultValue="history">
          <TabsList className="mb-4">
            <TabsTrigger value="history">
              Historique ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="packs">Packs disponibles</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <TransactionsTable transactions={transactions} />
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} />
            )}
          </TabsContent>

          <TabsContent value="packs">
            <PacksGrid packs={packs} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

// ─── Sub components ───────────────────────────────────────

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

function TransactionsTable({
  transactions,
}: {
  transactions: Array<{
    id: string;
    createdAt: Date;
    type: WalletTxType;
    description: string | null;
    amountCents: number;
    balanceAfterCents: number;
  }>;
}) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <span
          className="grid h-12 w-12 place-items-center rounded-full bg-blue-50"
          aria-hidden
        >
          <WalletIcon
            className="h-6 w-6 text-[#1e3a8a]"
            strokeWidth={1.75}
          />
        </span>
        <p className="text-[14px] font-semibold text-slate-900">
          Aucune transaction pour le moment
        </p>
        <p className="text-[12.5px] text-slate-500">
          Vos achats de leads et recharges apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left font-semibold text-slate-600">
              Date
            </th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">
              Type
            </th>
            <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 sm:table-cell">
              Description
            </th>
            <th className="px-4 py-3 text-right font-semibold text-slate-600">
              Montant
            </th>
            <th className="hidden px-4 py-3 text-right font-semibold text-slate-600 sm:table-cell">
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
                className="border-b border-slate-100 last:border-0"
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
                    "px-4 py-3 text-right font-semibold",
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

function PacksGrid({
  packs,
}: {
  packs: Array<{
    id: string;
    priceEur: number;
    creditEur: number;
    bonusEur: number;
    label: string;
    featured?: boolean;
  }>;
}) {
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
            "relative rounded-xl border bg-white p-5 transition-colors",
            p.featured
              ? "border-[#1e3a8a] shadow-md"
              : "border-slate-200 shadow-sm",
          )}
        >
          {p.featured && (
            <span
              className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <Sparkles className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              Populaire
            </span>
          )}
          <h3 className="text-[15px] font-bold text-slate-900">{p.label}</h3>
          <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900">
            {p.priceEur} €
          </p>
          <p className="mt-2 text-[13px] text-slate-600">
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

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const prevHref = page > 1 ? `/dashboard/wallet?page=${page - 1}` : null;
  const nextHref =
    page < totalPages ? `/dashboard/wallet?page=${page + 1}` : null;

  return (
    <nav className="mt-4 flex items-center justify-center gap-2">
      <PageButton href={prevHref} aria="Page précédente">
        <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      </PageButton>
      <span className="text-[13px] text-slate-600">
        Page {page} / {totalPages}
      </span>
      <PageButton href={nextHref} aria="Page suivante">
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
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
