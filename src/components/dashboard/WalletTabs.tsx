"use client";

import { useSearchParams } from "next/navigation";

import { PacksGrid } from "@/components/dashboard/wallet/PacksGrid";
import { PillTab } from "@/components/dashboard/wallet/PillTab";
import { TransactionsTable } from "@/components/dashboard/wallet/TransactionsTable";
import { WalletPagination } from "@/components/dashboard/wallet/WalletPagination";
import type { WalletPack, WalletTransactionRow } from "@/server/queries/wallet";

type Props = {
  transactions: WalletTransactionRow[];
  totalCount: number;
  packs: WalletPack[];
  page: number;
  totalPages: number;
};

/**
 * Wallet tabs orchestrateur (Client Component) : Historique / Packs.
 * State 100% derive de l'URL (?tab=packs). Sous-composants extraits
 * en Sprint 5b dans src/components/dashboard/wallet/ :
 *   - PillTab : nav onglets, navigation via <Link replace scroll={false}>
 *   - TransactionsTable : table historique transactions
 *   - PacksGrid + PackCard : grille packs Stripe Checkout
 *   - WalletPagination : nav pages historique (server-side via ?page=)
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
  const searchParams = useSearchParams();
  const active: "history" | "packs" =
    searchParams.get("tab") === "packs" ? "packs" : "history";

  return (
    <div id="packs">
      <div className="mb-4 flex flex-wrap gap-1.5">
        <PillTab active={active === "history"} tab="history">
          Historique ({totalCount})
        </PillTab>
        <PillTab active={active === "packs"} tab="packs">
          Packs disponibles
        </PillTab>
      </div>

      {active === "history" ? (
        <>
          <TransactionsTable transactions={transactions} />
          {totalPages > 1 && (
            <WalletPagination page={page} totalPages={totalPages} />
          )}
        </>
      ) : (
        <PacksGrid packs={packs} />
      )}
    </div>
  );
}
