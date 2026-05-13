"use client";

import { useState } from "react";

import { LeadRow } from "@/components/dashboard/LeadRow";
import { cn } from "@/lib/utils";
import type { AvailableLead } from "@/server/queries/available-leads";

type Props = {
  leads: AvailableLead[];
  categories: Array<{ id: string; name: string; count: number }>;
  allCount: number;
};

/**
 * Filtre par categorie (pill tabs) + liste flat des leads disponibles.
 * Client Component pour gerer le state du filtre actif sans roundtrip
 * server. Reutilise LeadRow (icones phosphor, flat row).
 */
export function LeadsCategoryFilter({ leads, categories, allCount }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered =
    activeCategory === "all"
      ? leads
      : leads.filter((l) => l.categoryId === activeCategory);

  return (
    <>
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-5 py-4">
        <PillTab
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        >
          Tous ({allCount})
        </PillTab>
        {categories.map((c) => (
          <PillTab
            key={c.id}
            active={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.name} ({c.count})
          </PillTab>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {filtered.map((l) => (
          <LeadRow
            key={l.assignmentId}
            assignmentId={l.assignmentId}
            categoryName={l.categoryName}
            subCategoryName={l.subCategoryName}
            city={l.city}
            postalCode={l.postalCode}
            urgency={l.urgency}
            priceCents={l.priceCents}
            createdAt={l.createdAt}
            primaryAction={{
              label: "Acheter le lead",
              href: `/dashboard/leads/${l.assignmentId}`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function PillTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
    </button>
  );
}
