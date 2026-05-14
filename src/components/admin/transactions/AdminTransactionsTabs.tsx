"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { AdminTxTab } from "@/server/queries/admin-transactions";

type Tab = {
  value: AdminTxTab;
  label: string;
  count: number;
};

type Props = {
  tabs: Tab[];
};

export function AdminTransactionsTabs({ tabs }: Props) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("type") as AdminTxTab) ?? "tous";

  return (
    <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={
              tab.value === "tous"
                ? "/admin/transactions"
                : `/admin/transactions?type=${tab.value}`
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
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600">
                  {tab.count}
                </span>
              )}
            </span>
            <span
              className={cn(
                "h-1 w-1 rounded-full transition-colors",
                isActive ? "bg-[#ea580c]" : "bg-transparent",
              )}
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
