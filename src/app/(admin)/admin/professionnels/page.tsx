import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

import { AdminProRow } from "@/components/admin/pros/AdminProRow";
import { AdminProsTabs } from "@/components/admin/pros/AdminProsTabs";
import { requireAdminSession } from "@/lib/auth-guards";
import { cn } from "@/lib/utils";
import {
  getProsTabsCounts,
  listAdminPros,
  type AdminProsTab,
} from "@/server/queries/admin-pros";

const PAGE_SIZE = 30;
const VALID_TABS: ReadonlyArray<AdminProsTab> = [
  "tous",
  "en-attente",
  "valides",
  "suspendus",
  "refuses",
];

type SearchParams = Promise<{ onglet?: string; page?: string }>;

export default async function AdminProsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminSession();
  const sp = await searchParams;
  const tab: AdminProsTab = VALID_TABS.includes(sp.onglet as AdminProsTab)
    ? (sp.onglet as AdminProsTab)
    : "tous";
  const page = Math.max(1, Number(sp.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [{ rows, total }, counts] = await Promise.all([
    listAdminPros({ tab, limit: PAGE_SIZE, skip }),
    getProsTabsCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Professionnels
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          {counts.tous} pro{counts.tous > 1 ? "s" : ""} au total,{" "}
          {counts["en-attente"]} en attente de validation.
        </p>
      </header>

      <AdminProsTabs
        tabs={[
          { value: "tous", label: "Tous", count: counts.tous },
          {
            value: "en-attente",
            label: "En attente",
            count: counts["en-attente"],
            urgent: true,
          },
          { value: "valides", label: "Validés", count: counts.valides },
          { value: "suspendus", label: "Suspendus", count: counts.suspendus },
          { value: "refuses", label: "Refusés", count: counts.refuses },
        ]}
      />

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-slate-500">
            Aucun pro dans cet onglet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((pro) => (
              <AdminProRow key={pro.proProfileId} pro={pro} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-5 py-3">
            <Pagination tab={tab} page={page} totalPages={totalPages} />
          </div>
        )}
      </section>
    </main>
  );
}

function Pagination({
  tab,
  page,
  totalPages,
}: {
  tab: AdminProsTab;
  page: number;
  totalPages: number;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (tab !== "tous") params.set("onglet", tab);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/professionnels${qs ? `?${qs}` : ""}`;
  };
  const prevHref = page > 1 ? buildHref(page - 1) : null;
  const nextHref = page < totalPages ? buildHref(page + 1) : null;

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
