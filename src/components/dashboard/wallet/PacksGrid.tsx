import type { WalletPack } from "@/server/queries/wallet";

import { PackCard } from "./PackCard";
import { ReassurancesBar } from "./ReassurancesBar";

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
    <section className="pt-2">
      <h2 className="font-display mb-6 text-[22px] font-bold tracking-tight text-slate-900 sm:text-[26px]">
        Recharger mon wallet
      </h2>

      {/* gap-y plus large que gap-x pour laisser respirer le badge
          'LE PLUS POPULAIRE' qui dépasse en haut de la card centrale. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-3">
        {packs.map((p) => (
          <PackCard key={p.id} pack={p} />
        ))}
      </div>

      <ReassurancesBar />
    </section>
  );
}
