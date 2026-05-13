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
  type Icon,
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
      className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-5"
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50"
        aria-hidden
      >
        <CheckCircle size={20} weight="regular" className="text-emerald-600" />
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
            <MapPin size={14} weight="regular" />
            {lead.postalCode} {lead.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} weight="regular" />
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
          <Icon size={12} weight="bold" />
          {meta.label}
        </span>
        <div className="text-right">
          <div className="font-display text-[14px] font-bold text-slate-700">
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
        "rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors",
        active
          ? "border-slate-300 bg-slate-100 text-slate-900"
          : "border-transparent bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      {children}
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
