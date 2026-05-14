"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  tab: "history" | "packs";
  children: React.ReactNode;
};

/**
 * Pill tab navigation pour /dashboard/wallet. URL-driven via `?tab=...` :
 *  - `replace` : pas d'entree historique a chaque switch d'onglet.
 *  - `scroll={false}` : evite le scroll auto en haut de page.
 *
 * URL canon "history" = pas de query (defaut). URL "packs" = ?tab=packs.
 */
export function PillTab({ active, tab, children }: Props) {
  const href = tab === "packs" ? "/dashboard/wallet?tab=packs" : "/dashboard/wallet";
  return (
    <Link
      href={href}
      replace
      scroll={false}
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
    </Link>
  );
}
