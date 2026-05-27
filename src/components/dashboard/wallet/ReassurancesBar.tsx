import {
  CreditCard,
  Lightning,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";

// Bande de reassurances sous la grille de packs. 3 colonnes :
//  - Paiement securise (cadenas)
//  - Stripe (carte de credit — pas de logo Stripe officiel pour rester
//    homogene avec Phosphor partout dans le dashboard)
//  - Recharge instantanee (eclair)

type Item = {
  Icon: ComponentType<{
    size?: number;
    weight?: "regular" | "bold" | "fill";
    className?: string;
  }>;
  title: string;
  subtitle: string;
};

const ITEMS: ReadonlyArray<Item> = [
  {
    Icon: ShieldCheck,
    title: "Paiement 100% sécurisé",
    subtitle: "Vos données sont protégées.",
  },
  {
    Icon: CreditCard,
    title: "Paiement sécurisé via Stripe",
    subtitle: "CB, Visa, Mastercard, Apple Pay.",
  },
  {
    Icon: Lightning,
    title: "Recharge instantanée",
    subtitle: "Crédit disponible immédiatement.",
  },
];

export function ReassurancesBar() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
      {ITEMS.map(({ Icon, title, subtitle }) => (
        <div key={title} className="flex items-start gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100"
            aria-hidden
          >
            <Icon size={18} weight="regular" className="text-slate-600" />
          </span>
          <div className="leading-tight">
            <p className="text-[13.5px] font-semibold text-slate-900">
              {title}
            </p>
            <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
