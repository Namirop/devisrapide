import type { WalletPack } from "@/server/queries/wallet";

import { PackCard } from "./PackCard";

type Props = {
  packs: WalletPack[];
};

export function PacksGrid({ packs }: Props) {
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
        <PackCard key={p.id} pack={p} />
      ))}
    </div>
  );
}
