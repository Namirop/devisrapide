"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  href: string;
  /**
   * Icone deja rendue (ReactElement) cote Server pour respecter la
   * frontiere RSC. Le parent SidebarContent instancie le composant
   * Phosphor (en weight regular) avant de passer.
   */
  icon: ReactNode;
  /** Variante active de l'icone (weight bold Phosphor) — affichee quand active. */
  iconActive?: ReactNode;
  label: string;
  badge?: number;
};

/**
 * Lien de navigation Sidebar dashboard. Dark theme (sidebar bg
 * #0f1e3d = --color-b2b-dark). Item actif :
 *   - bg interieur en navy-mid (#1a2950)
 *   - barre verticale 3px en orange accent (#ea580c) collee a gauche
 *   - icone passe en variante "bold" Phosphor + text-white
 *   - label en font-medium text-white
 *
 * Item inactif : text-slate-300, icon text-slate-400, hover bg-white/5.
 */
export function NavLink({ href, icon, iconActive, label, badge }: Props) {
  const pathname = usePathname();
  const isExact = pathname === href;
  const isSub = href !== "/dashboard" && pathname.startsWith(`${href}/`);
  const active = isExact || isSub;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors",
        active
          ? "bg-[var(--color-navy-mid)] font-medium text-white"
          : "font-medium text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      {active && (
        <span
          className="absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--accent)]"
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
        <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-px text-[11px] font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
