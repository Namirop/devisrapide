"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Tray } from "@phosphor-icons/react";

import { LeadRow } from "@/components/dashboard/LeadRow";
import { cn } from "@/lib/utils";
import type { AvailableLead } from "@/server/queries/available-leads";

type Props = {
  leads: AvailableLead[];
  totalCount: number;
};

/**
 * Section "Leads disponibles pour vous" du dashboard home.
 *
 * Refonte 2b redesign :
 *  - Card englobante avec border-t-3 orange (signal "important")
 *  - Pill tabs categorie (rounded-full) au lieu de tabs underline shadcn
 *  - Liste flat (LeadRow sans card individuelle) avec border-b entre items
 *
 * Filtrage des onglets cote client (state local). Les 5 leads ne sont
 * pas re-fetchs : on filtre l'array.
 */
export function AvailableLeadsSection({ leads, totalCount }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Categories presentes dans les leads recus, en preservant l'ordre.
  const categoriesById = new Map<
    string,
    { id: string; name: string; count: number }
  >();
  for (const l of leads) {
    const prev = categoriesById.get(l.categoryId);
    if (prev) prev.count++;
    else
      categoriesById.set(l.categoryId, {
        id: l.categoryId,
        name: l.categoryName,
        count: 1,
      });
  }
  const categories = Array.from(categoriesById.values());

  const filteredLeads =
    activeCategory === "all"
      ? leads
      : leads.filter((l) => l.categoryId === activeCategory);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Border-t orange 3px = signal "important / actionnable" */}
      <div
        className="h-[3px] w-full"
        style={{ backgroundColor: "#ea580c" }}
        aria-hidden
      />

      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
            Leads disponibles pour vous
          </h2>
          {totalCount > 0 && (
            <span className="font-display rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] font-bold text-[#ea580c]">
              {totalCount} nouveau{totalCount > 1 ? "x" : ""}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1e3a8a] hover:underline"
        >
          Voir tous
          <ArrowRight size={14} weight="bold" />
        </Link>
      </header>

      {leads.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Pill tabs (rounded-full au lieu de tabs underline shadcn) */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-5 pb-4">
            <PillTab
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            >
              Tous ({leads.length})
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

          {/* Liste flat avec border-b entre items */}
          <div className="divide-y divide-slate-100">
            {filteredLeads.map((l) => (
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
      )}
    </section>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span
        className="grid h-12 w-12 place-items-center rounded-full bg-blue-50"
        aria-hidden
      >
        <Tray size={24} weight="regular" className="text-[#1e3a8a]" />
      </span>
      <div>
        <p className="text-[14.5px] font-semibold text-slate-900">
          Aucun lead disponible pour le moment
        </p>
        <p className="mt-1 text-[12.5px] text-slate-500">
          Vous serez notifié par email dès qu&apos;un nouveau lead matche
          votre profil.
        </p>
      </div>
    </div>
  );
}
