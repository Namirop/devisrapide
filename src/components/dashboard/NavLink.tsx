"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  href: string;
  /**
   * Icone deja rendue (ReactElement) cote Server pour respecter la
   * frontiere RSC : on ne peut pas passer un composant fonction
   * (`LucideIcon`) en prop d'un Server vers Client Component. Le
   * parent Sidebar instancie `<LayoutDashboard />` avant de la passer.
   */
  icon: ReactNode;
  label: string;
  badge?: number;
};

/**
 * Lien de navigation dans la Sidebar dashboard. Client Component minimal
 * pour pouvoir lire `usePathname` et highlight l'item actif.
 *
 * Match actif : pathname === href OU pathname commence par `${href}/`
 * (= sous-pages, ex: /dashboard/leads/[id] doit highlight "Leads
 * disponibles"). Exception : "/dashboard" exact, sinon il matcherait
 * toutes les sous-routes.
 */
export function NavLink({ href, icon, label, badge }: Props) {
  const pathname = usePathname();
  const isExact = pathname === href;
  const isSub = href !== "/dashboard" && pathname.startsWith(`${href}/`);
  const active = isExact || isSub;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors",
        active
          ? "bg-[#1e3a8a]/8 text-[#1e3a8a]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r-full"
          style={{ width: 3, backgroundColor: "#1e3a8a" }}
          aria-hidden
        />
      )}
      <span
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center",
          active && "text-[#1e3a8a]",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            active
              ? "bg-[#1e3a8a] text-white"
              : "bg-slate-200 text-slate-700 group-hover:bg-slate-300",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
