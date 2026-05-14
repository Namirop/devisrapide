"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  href: string;
  icon: ReactNode;
  iconActive?: ReactNode;
  label: string;
  badge?: number;
};

/**
 * Variant admin de NavLink. Difference visuelle vs dashboard pro :
 *  - active bg : #2a3045 (charcoal-lighter) au lieu de navy-mid #1a2950
 *  - accent bar : #dc2626 (rouge admin) au lieu d'orange #ea580c
 *  - badge bg : rouge #dc2626 au lieu d'orange (signal urgence admin
 *    pour les compteurs en attente/en souffrance)
 *
 * Sinon meme API que NavLink : icon Phosphor pre-rendu en server,
 * iconActive optionnel pour swap weight regular → bold sur active.
 */
export function AdminNavLink({
  href,
  icon,
  iconActive,
  label,
  badge,
}: Props) {
  const pathname = usePathname();
  const isExact = pathname === href;
  const isSub = href !== "/admin" && pathname.startsWith(`${href}/`);
  const active = isExact || isSub;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors",
        active
          ? "bg-[#2a3045] font-medium text-white"
          : "font-medium text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      {active && (
        <span
          className="absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[#dc2626]"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center",
          active ? "text-white" : "text-slate-400 group-hover:text-white",
        )}
        aria-hidden
      >
        {active && iconActive ? iconActive : icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#dc2626] px-1.5 py-px text-[11px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
