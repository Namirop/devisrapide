"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { AdminProsTab } from "@/server/queries/admin-pros";

type Tab = {
  value: AdminProsTab;
  label: string;
  count: number;
  urgent?: boolean;
};

type Props = {
  tabs: Tab[];
};

/**
 * Pills tabs pour /admin/professionnels. URL-driven via ?onglet=
 * (preserve `?onglet=en-attente` quand on revient depuis la home admin
 * "Voir tous").
 *
 * "En attente" est tag urgent → dot indicator + count badge en rouge
 * admin si count > 0 (besoin d'action admin pour valider).
 */
export function AdminProsTabs({ tabs }: Props) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("onglet") as AdminProsTab) ?? "tous";

  return (
    <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        const isUrgent = tab.urgent && tab.count > 0;
        return (
          <Link
            key={tab.value}
            href={
              tab.value === "tous"
                ? "/admin/professionnels"
                : `/admin/professionnels?onglet=${tab.value}`
            }
            className={cn(
              "flex flex-col items-center gap-1 px-3 pt-1 text-[12.5px] font-medium transition-colors",
              isActive
                ? "text-slate-900"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
                    isUrgent
                      ? "bg-rose-50 text-rose-700"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            <span
              className={cn(
                "h-1 w-1 rounded-full transition-colors",
                isActive
                  ? isUrgent
                    ? "bg-rose-600"
                    : "bg-[#ea580c]"
                  : "bg-transparent",
              )}
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
