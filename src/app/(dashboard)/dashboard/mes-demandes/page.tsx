import Link from "next/link";
import { CaretLeft, CaretRight, Tray } from "@phosphor-icons/react/dist/ssr";

import { MyLeadsStatusFilter } from "@/components/dashboard/MyLeadsStatusFilter";
import { requireProSession } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";
import { countMyLeads, getMyLeads } from "@/server/queries/my-leads";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

export default async function MesDemandesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { proProfileId } = await requireProSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [leads, totalCount] = await Promise.all([
    getMyLeads({
      proProfileId,
      limit: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    countMyLeads(proProfileId),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-5 sm:mb-6">
        <h1 className="font-display text-[24px] font-bold tracking-tight text-slate-900 sm:text-[28px] lg:text-[34px]">
          Mes demandes
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-600 sm:text-[14.5px]">
          {totalCount > 1
            ? `${totalCount} leads acceptés.`
            : `${totalCount} lead accepté.`}
        </p>
      </header>

      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <MyLeadsStatusFilter leads={leads} />
          {totalPages > 1 && (
            <div className="border-t border-slate-200 px-5 py-3">
              <Pagination page={page} totalPages={totalPages} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span
        className="grid h-14 w-14 place-items-center rounded-full bg-blue-50"
        aria-hidden
      >
        <Tray size={28} weight="regular" className="text-[#1e3a8a]" />
      </span>
      <div>
        <p className="font-display text-[16px] font-bold text-slate-900">
          Vous n&apos;avez encore accepté aucun lead
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          Les leads que vous achetez apparaîtront ici, classés par statut
          de suivi.
        </p>
      </div>
      <Link
        href="/dashboard/leads"
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#1e3a8a] hover:underline"
      >
        Voir les leads disponibles →
      </Link>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const prevHref = page > 1 ? `/dashboard/mes-demandes?page=${page - 1}` : null;
  const nextHref =
    page < totalPages ? `/dashboard/mes-demandes?page=${page + 1}` : null;

  return (
    <nav className="flex items-center justify-center gap-2">
      <PageButton href={prevHref} aria="Page précédente">
        <CaretLeft size={14} weight="bold" />
      </PageButton>
      <span className="text-[13px] text-slate-600">
        Page {page} / {totalPages}
      </span>
      <PageButton href={nextHref} aria="Page suivante">
        <CaretRight size={14} weight="bold" />
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
