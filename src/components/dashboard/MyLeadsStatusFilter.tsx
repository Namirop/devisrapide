"use client";

import { useState } from "react";
import Link from "next/link";
import type { LeadFollowupStatus } from "@prisma/client";
import {
  CheckCircle,
  Clock,
  MapPin,
  Question,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import type { Icon as IconType } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/stats";
import type { MyLead } from "@/server/queries/my-leads";

type Props = {
  leads: MyLead[];
};

const FOLLOWUP_META: Record<
  LeadFollowupStatus,
  { label: string; icon: IconType; bg: string; text: string }
> = {
  PENDING: {
    label: "À qualifier",
    icon: Question,
    bg: "bg-slate-100",
    text: "text-slate-700",
  },
  CONVERTED: {
    label: "Converti",
    icon: CheckCircle,
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
    icon: Warning,
    bg: "bg-orange-50",
    text: "text-[#ea580c]",
  },
};

type FilterValue = "all" | LeadFollowupStatus;

/**
 * Pill tabs followupStatus + liste flat des leads ACCEPTED. Client
 * Component pour pill tabs sans roundtrip server. Cohérent visuellement
 * avec le pattern home + /leads.
 */
export function MyLeadsStatusFilter({ leads }: Props) {
  const [active, setActive] = useState<FilterValue>("all");

  const countByStatus: Record<LeadFollowupStatus, number> = {
    PENDING: 0,
    CONVERTED: 0,
    NO_FOLLOWUP: 0,
    NOT_REACHABLE: 0,
  };
  for (const l of leads) countByStatus[l.followupStatus]++;

  const filtered =
    active === "all" ? leads : leads.filter((l) => l.followupStatus === active);

  return (
    <>
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 px-5 py-4">
        <PillTab active={active === "all"} onClick={() => setActive("all")}>
          Tous ({leads.length})
        </PillTab>
        <PillTab
          active={active === "PENDING"}
          onClick={() => setActive("PENDING")}
        >
          À qualifier ({countByStatus.PENDING})
        </PillTab>
        <PillTab
          active={active === "CONVERTED"}
          onClick={() => setActive("CONVERTED")}
        >
          Convertis ({countByStatus.CONVERTED})
        </PillTab>
        <PillTab
          active={active === "NO_FOLLOWUP"}
          onClick={() => setActive("NO_FOLLOWUP")}
        >
          Sans suite ({countByStatus.NO_FOLLOWUP})
        </PillTab>
        <PillTab
          active={active === "NOT_REACHABLE"}
          onClick={() => setActive("NOT_REACHABLE")}
        >
          Non joignables ({countByStatus.NOT_REACHABLE})
        </PillTab>
      </div>
      <div className="divide-y divide-slate-100">
        {filtered.map((l) => (
          <MyLeadRow key={l.assignmentId} lead={l} />
        ))}
      </div>
    </>
  );
}

function MyLeadRow({ lead }: { lead: MyLead }) {
  const meta = FOLLOWUP_META[lead.followupStatus];
  const Icon = meta.icon;
  return (
    <Link
      href={`/dashboard/mes-demandes/${lead.assignmentId}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:gap-5 sm:px-5 sm:py-4"
    >
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-50 sm:h-11 sm:w-11"
        aria-hidden
      >
        <CheckCircle
          size={22}
          weight="regular"
          className="text-emerald-600"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="truncate text-[13.5px] font-semibold text-slate-900 sm:text-[14.5px]">
            {lead.categoryName}
          </span>
          <span className="text-[11.5px] text-slate-400 sm:text-[12.5px]">
            ·
          </span>
          <span className="truncate text-[12.5px] text-slate-500 sm:text-[13px]">
            {lead.subCategoryName}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-slate-500 sm:gap-x-3 sm:text-[12.5px]">
          <span className="truncate">
            {lead.clientFirstName} {lead.clientLastName}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} weight="regular" />
            <span className="sm:hidden">{lead.postalCode}</span>
            <span className="hidden sm:inline">
              {lead.postalCode} {lead.city}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} weight="regular" />
            <span className="sm:hidden">{formatRelativeAge(lead.acceptedAt)}</span>
            <span className="hidden sm:inline">
              Accepté {formatRelativeAge(lead.acceptedAt)}
            </span>
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11.5px]",
            meta.bg,
            meta.text,
          )}
        >
          <Icon size={11} weight="bold" />
          {meta.label}
        </span>
        <div className="text-right">
          <div className="font-display text-[13px] font-bold text-slate-700 sm:text-[14px]">
            {formatPriceCents(lead.priceCents)}
          </div>
          <div className="hidden text-[10.5px] uppercase tracking-wider text-slate-400 sm:block">
            Payé
          </div>
        </div>
      </div>
    </Link>
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

function formatRelativeAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}
