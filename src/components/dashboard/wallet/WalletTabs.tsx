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
 * Onglets Historique / Packs de /dashboard/wallet, entièrement dérivés de
 * l'URL (`?tab=packs`). L'historique est paginé côté serveur via `?page=` ;
 * changer d'onglet ramène donc l'historique en page 1.
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
