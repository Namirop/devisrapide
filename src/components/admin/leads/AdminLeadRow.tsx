import Link from "next/link";
import { Eye, MapPin } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/stats";
import { nowMinusHoursMs } from "@/lib/time";
import type { AdminLeadRow as Row } from "@/server/queries/admin-leads";

type Props = {
  lead: Row;
};

/**
 * Ligne de la liste /admin/leads. Click sur l'icone oeil → detail
 * /admin/leads/[id]. Status badge colore selon la regle :
 *  - PENDING_MATCH / ASSIGNED : bleu (actif)
 *  - ACCEPTED / COMPLETED : vert
 *  - EXPIRED / CANCELLED : gris
 *  - Override : rouge si "en souffrance" (>2h actif sans accept)
 */
export function AdminLeadRow({ lead }: Props) {
  const twoHoursAgoMs = nowMinusHoursMs(2);
  const isSouffrance =
    (lead.status === "PENDING_MATCH" || lead.status === "ASSIGNED") &&
    lead.matchingStartedAt !== null &&
    lead.matchingStartedAt.getTime() < twoHoursAgoMs &&
    lead.acceptedAssignmentsCount === 0;

  const statusMeta = getStatusMeta(lead.status, isSouffrance);

  return (
    <Link
      href={`/admin/leads/${lead.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:gap-5 sm:px-5 sm:py-4"
    >
      <span
        className="hidden font-mono text-[11px] text-slate-400 sm:inline"
        aria-hidden
      >
        #{lead.id.slice(-6)}
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
          {/* "Exclusif" et "Souffrance" sont mutuellement exclusifs : un lead
              exclusif qui traine sans acheteur est avant tout un lead a
              relancer (souffrance), on ne l'annonce pas comme exclusif. La
              souffrance impliquant 0 acheteur, masquer ici ne cache jamais
              une vente exclusive (1 acheteur => pas en souffrance). */}
          {lead.isExclusive && !isSouffrance && (
            <span className="ml-1 rounded-sm bg-[#1e3a8a]/10 px-1.5 py-px text-[10.5px] font-semibold text-[#1e3a8a]">
              Exclusif
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-slate-500 sm:gap-x-3 sm:text-[12.5px]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} weight="regular" />
            {lead.postalCode} {lead.city}
          </span>
          <span>{formatRelativeAge(lead.createdAt)}</span>
          <span>
            Achetés : {lead.acceptedAssignmentsCount}
          </span>
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
          statusMeta.bg,
          statusMeta.text,
        )}
      >
        {statusMeta.label}
      </span>

      <div className="hidden shrink-0 text-right sm:block">
        <div className="font-display text-[14px] font-bold text-slate-900 sm:text-[16px]">
          {formatPriceCents(lead.priceCents)}
        </div>
      </div>

      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition-colors group-hover:text-slate-700"
        aria-hidden
      >
        <Eye size={16} weight="regular" />
      </span>
    </Link>
  );
}

function getStatusMeta(
  status: Row["status"],
  isSouffrance: boolean,
): { label: string; bg: string; text: string } {
  if (isSouffrance) {
    return {
      label: "Souffrance",
      bg: "bg-rose-50",
      text: "text-rose-700",
    };
  }
  switch (status) {
    case "PENDING_MATCH":
    case "ASSIGNED":
      return { label: "Actif", bg: "bg-blue-50", text: "text-[#1e3a8a]" };
    case "ACCEPTED":
    case "COMPLETED":
      return {
        label: "Acheté",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
      };
    case "EXPIRED":
    case "CANCELLED":
      return { label: "Expiré", bg: "bg-slate-100", text: "text-slate-600" };
  }
}

function formatRelativeAge(d: Date): string {
  const ms = Date.now() - d.getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
