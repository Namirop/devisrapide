import Link from "next/link";

import { WalletTabs } from "@/components/dashboard/WalletTabs";
import { WalletToastFeedback } from "@/components/dashboard/WalletToastFeedback";
import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";
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
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Wallet & Crédits
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          Gérez votre solde de crédits et consultez votre historique de
          transactions.
        </p>
      </header>

      {/* Solde XXL : pas de card englobante, juste un bloc bg-white border-l
          orange 3px (signal "wallet") avec chiffres en font-display */}
      <section
        className="mb-8 flex flex-wrap items-end justify-between gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        style={{ borderLeftWidth: 3, borderLeftColor: "#ea580c" }}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
            Solde actuel
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-[44px] font-bold leading-none tracking-tight text-slate-900 lg:text-[56px]">
              {formatPriceCents(balance)}
            </span>
            <span className="text-[13px] text-slate-500">
              {credits} crédit{credits > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/wallet?tab=packs#packs"
          scroll
          className="inline-flex items-center justify-center rounded-md bg-[#ea580c] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#c2410c]"
        >
          Recharger mon wallet
        </Link>
      </section>

      <WalletTabs
        transactions={transactions}
        totalCount={totalCount}
        packs={packs}
        page={page}
        totalPages={totalPages}
      />

      {/* Toast feedback pour les retours Stripe Checkout (?recharge=
          success|cancelled) + router.refresh() pour rafraichir le solde. */}
      <WalletToastFeedback />
    </main>
  );
}
