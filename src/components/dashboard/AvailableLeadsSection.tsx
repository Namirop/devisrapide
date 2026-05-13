import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

import { LeadRow } from "@/components/dashboard/LeadRow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { AvailableLead } from "@/server/queries/available-leads";

type Props = {
  leads: AvailableLead[];
  totalCount: number;
};

/**
 * Section "Leads disponibles pour vous" du dashboard home.
 * - Onglets de filtre par categorie, derives dynamiquement depuis les
 *   leads recus (pas la liste complete des cats du pro pour eviter des
 *   onglets vides).
 * - Au plus 5 leads affiches (la page /dashboard/leads en montre plus).
 * - Bouton "Acheter le lead" pointe vers /dashboard/leads/[assignmentId]
 *   ou la transaction reelle a lieu (voir commit 13).
 */
export function AvailableLeadsSection({ leads, totalCount }: Props) {
  // Categories presentes dans les 5 leads, en preservant l'ordre d'apparition.
  const categoriesById = new Map<string, { id: string; name: string; count: number }>();
  for (const l of leads) {
    const prev = categoriesById.get(l.categoryId);
    if (prev) {
      prev.count++;
    } else {
      categoriesById.set(l.categoryId, {
        id: l.categoryId,
        name: l.categoryName,
        count: 1,
      });
    }
  }
  const categories = Array.from(categoriesById.values());

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[17px] font-bold text-slate-900">
            Leads disponibles pour vous
          </h2>
          {totalCount > 0 && (
            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] font-semibold text-[#ea580c]">
              {totalCount} nouveau{totalCount > 1 ? "x" : ""}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1e3a8a] hover:underline"
        >
          Voir tous
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </header>

      {leads.length === 0 ? (
        <EmptyState />
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tous ({leads.length})</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name} ({c.count})
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="all" className="space-y-3">
            {leads.map((l) => (
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
          </TabsContent>
          {categories.map((c) => (
            <TabsContent key={c.id} value={c.id} className="space-y-3">
              {leads
                .filter((l) => l.categoryId === c.id)
                .map((l) => (
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
            </TabsContent>
          ))}
        </Tabs>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      <span
        className="grid h-12 w-12 place-items-center rounded-full bg-blue-50"
        aria-hidden
      >
        <Inbox className="h-6 w-6 text-[#1e3a8a]" strokeWidth={1.75} />
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
