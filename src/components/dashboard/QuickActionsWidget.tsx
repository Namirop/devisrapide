import Link from "next/link";
import { History, LifeBuoy, Wallet, type LucideIcon } from "lucide-react";

import { CONTACT } from "@/lib/contact";

type Action = {
  icon: LucideIcon;
  label: string;
  sub: string;
  href: string;
  external?: boolean;
};

const ACTIONS: Action[] = [
  {
    icon: Wallet,
    label: "Recharger mon wallet",
    sub: "Approvisionner mes crédits",
    href: "/dashboard/wallet",
  },
  {
    icon: History,
    label: "Voir mon historique",
    sub: "Transactions wallet",
    href: "/dashboard/wallet",
  },
  {
    icon: LifeBuoy,
    label: "Contacter le support",
    sub: CONTACT.EMAIL,
    href: `mailto:${CONTACT.EMAIL}`,
    external: true,
  },
];

export function QuickActionsWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-[14.5px] font-bold text-slate-900">
        Actions rapides
      </h3>
      <ul className="flex flex-col gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.label}>
              <Link
                href={a.href}
                target={a.external ? "_blank" : undefined}
                className="group flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-50"
                  aria-hidden
                >
                  <Icon
                    className="h-[16px] w-[16px] text-[#1e3a8a]"
                    strokeWidth={2}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-900 group-hover:text-[#1e3a8a]">
                    {a.label}
                  </div>
                  <div className="truncate text-[11.5px] text-slate-500">
                    {a.sub}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
