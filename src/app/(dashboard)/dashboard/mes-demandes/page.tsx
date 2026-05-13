import Link from "next/link";
import type { LeadFollowupStatus } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Inbox,
  MapPin,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireProSession } from "@/lib/auth-guards";
import { formatPriceCents } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { countMyLeads, getMyLeads, type MyLead } from "@/server/queries/my-leads";

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

  // Compteurs par followupStatus sur la page courante (suffisant V1).
  const countByStatus: Record<LeadFollowupStatus, number> = {
    PENDING: 0,
    CONVERTED: 0,
    NO_FOLLOWUP: 0,
    NOT_REACHABLE: 0,
  };
  for (const l of leads) countByStatus[l.followupStatus]++;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 lg:text-[30px]">
          Mes demandes
        </h1>
        <p className="mt-1 text-[14px] text-slate-600">
          {totalCount} lead{totalCount > 1 ? "s" : ""} accepté
          {totalCount > 1 ? "s" : ""}.
        </p>
      </header>

      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Tous ({leads.length})</TabsTrigger>
              <TabsTrigger value="PENDING">
                À qualifier ({countByStatus.PENDING})
              </TabsTrigger>
              <TabsTrigger value="CONVERTED">
                Convertis ({countByStatus.CONVERTED})
              </TabsTrigger>
              <TabsTrigger value="NO_FOLLOWUP">
                Sans suite ({countByStatus.NO_FOLLOWUP})
              </TabsTrigger>
              <TabsTrigger value="NOT_REACHABLE">
                Non joignables ({countByStatus.NOT_REACHABLE})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="flex flex-col gap-3">
              {leads.map((l) => (
                <MyLeadRow key={l.assignmentId} lead={l} />
              ))}
            </TabsContent>
            {(
              [
                "PENDING",
                "CONVERTED",
                "NO_FOLLOWUP",
                "NOT_REACHABLE",
              ] as LeadFollowupStatus[]
            ).map((status) => (
              <TabsContent
                key={status}
                value={status}
                className="flex flex-col gap-3"
              >
                {leads
                  .filter((l) => l.followupStatus === status)
                  .map((l) => (
                    <MyLeadRow key={l.assignmentId} lead={l} />
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

// ─── Sub components ─────────────────────────────────────────

const FOLLOWUP_META: Record<
  LeadFollowupStatus,
  { label: string; icon: LucideIcon; bg: string; text: string }
> = {
  PENDING: {
    label: "À qualifier",
    icon: HelpCircle,
    bg: "bg-slate-100",
    text: "text-slate-700",
  },
  CONVERTED: {
    label: "Converti",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  NO_FOLLOWUP: {
    label: "Sans suite",
    icon: XCircle,
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
  NOT_REACHABLE: {
    label: "Non joignable",
    icon: AlertTriangle,
    bg: "bg-orange-50",
    text: "text-[#ea580c]",
  },
};

function MyLeadRow({ lead }: { lead: MyLead }) {
  const meta = FOLLOWUP_META[lead.followupStatus];
  const Icon = meta.icon;

  return (
    <Link
      href={`/dashboard/mes-demandes/${lead.assignmentId}`}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:gap-5"
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50"
        aria-hidden
      >
        <CheckCircle2
          className="h-[20px] w-[20px] text-emerald-600"
          strokeWidth={1.75}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-semibold text-slate-900">
            {lead.categoryName}
          </span>
          <span className="text-[12.5px] text-slate-400">·</span>
          <span className="truncate text-[13px] text-slate-500">
            {lead.subCategoryName}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
          <span>
            {lead.clientFirstName} {lead.clientLastName}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {lead.postalCode} {lead.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Accepté {formatRelativeAge(lead.acceptedAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
            meta.bg,
            meta.text,
          )}
        >
          <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          {meta.label}
        </span>
        <div className="text-right">
          <div className="text-[13.5px] font-semibold text-slate-700">
            {formatPriceCents(lead.priceCents)}
          </div>
          <div className="text-[10.5px] uppercase tracking-wider text-slate-400">
            Payé
          </div>
        </div>
      </div>
    </Link>
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

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const prevHref = page > 1 ? `/dashboard/mes-demandes?page=${page - 1}` : null;
  const nextHref =
    page < totalPages ? `/dashboard/mes-demandes?page=${page + 1}` : null;

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
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

function formatRelativeAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}
