import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { LeadRow } from "@/components/dashboard/LeadRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireProSession } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";
import {
  countAvailableLeads,
  getAvailableLeads,
} from "@/server/queries/available-leads";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

export default async function LeadsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { proProfileId } = await requireProSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [leads, totalCount] = await Promise.all([
    getAvailableLeads({ proProfileId, limit: PAGE_SIZE, skip }),
    countAvailableLeads(proProfileId),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Tabs catégorie : derives des leads de la page courante (V1 simple).
  // Pour une filtration globale par cat, il faudrait un query param
  // dedie + un index BDD — tracker en v2-roadmap si besoin.
  const categoriesById = new Map<string, { id: string; name: string; count: number }>();
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

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 lg:text-[30px]">
          Leads disponibles
        </h1>
        <p className="mt-1 text-[14px] text-slate-600">
          {totalCount} lead{totalCount > 1 ? "s" : ""} en attente d&apos;achat.
        </p>
      </header>

      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous ({leads.length})</TabsTrigger>
              {categories.map((c) => (
                <TabsTrigger key={c.id} value={c.id}>
                  {c.name} ({c.count})
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="flex flex-col gap-3">
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
              <TabsContent
                key={c.id}
                value={c.id}
                className="flex flex-col gap-3"
              >
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

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} />
          )}
        </>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span
        className="grid h-14 w-14 place-items-center rounded-full bg-blue-50"
        aria-hidden
      >
        <Inbox className="h-7 w-7 text-[#1e3a8a]" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-[15px] font-semibold text-slate-900">
          Aucun lead disponible pour le moment
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          Vous serez notifié par email dès qu&apos;un nouveau lead matche
          votre profil.
        </p>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const prevHref = page > 1 ? `/dashboard/leads?page=${page - 1}` : null;
  const nextHref =
    page < totalPages ? `/dashboard/leads?page=${page + 1}` : null;

  return (
    <nav className="mt-6 flex items-center justify-center gap-2">
      <PageButton href={prevHref} aria="Page précédente">
        <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      </PageButton>
      <span className="text-[13px] text-slate-600">
        Page {page} / {totalPages}
      </span>
      <PageButton href={nextHref} aria="Page suivante">
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </PageButton>
    </nav>
  );
}

function PageButton({
  href,
  aria,
  children,
}: {
  href: string | null;
  aria: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span
        aria-hidden
        className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 text-slate-300"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={aria}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors",
        "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      {children}
    </Link>
  );
}
