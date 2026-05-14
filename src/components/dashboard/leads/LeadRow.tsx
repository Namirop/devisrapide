import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import {
  Briefcase,
  Clock,
  MapPin,
  Warning,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/stats";

type Urgency = "URGENT" | "SOON" | "PLANNED" | "FLEXIBLE";

type Props = {
  assignmentId: string;
  categoryName: string;
  subCategoryName: string;
  city: string;
  postalCode: string;
  urgency: Urgency;
  priceCents: number;
  createdAt: Date;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  icon?: Icon;
};

/**
 * Ligne lead "flat" (refonte 2b redesign) : pas de card individuelle.
 * Une row dans un container parent qui gere les borders entre items.
 *
 * Hover : bg-slate-50.
 * Layout : icone gauche / titre + meta milieu / prix + CTA droite.
 *
 * Utilisee par :
 *  - <AvailableLeadsSection> sur /dashboard
 *  - /dashboard/leads (liste paginee)
 *  - /dashboard/mes-demandes (liste ACCEPTED)
 */
export function LeadRow({
  categoryName,
  subCategoryName,
  city,
  postalCode,
  urgency,
  priceCents,
  createdAt,
  primaryAction,
  secondaryAction,
  icon: IconComp = Briefcase,
}: Props) {
  const isUrgent = urgency === "URGENT";
  const ageLabel = formatRelativeAge(createdAt);

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:gap-5 sm:px-5 sm:py-4">
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 sm:h-11 sm:w-11"
        aria-hidden
      >
        <IconComp size={22} weight="regular" className="text-[#1e3a8a]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="truncate text-[13.5px] font-semibold text-slate-900 sm:text-[14.5px]">
            {categoryName}
          </span>
          <span className="text-[11.5px] text-slate-400 sm:text-[12.5px]">
            ·
          </span>
          <span className="truncate text-[12.5px] text-slate-500 sm:text-[13px]">
            {subCategoryName}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-slate-500 sm:gap-x-3 sm:text-[12.5px]">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} weight="regular" />
            <span className="truncate">
              <span className="sm:hidden">{postalCode}</span>
              <span className="hidden sm:inline">
                {postalCode} {city}
              </span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} weight="regular" />
            {ageLabel}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-[#ea580c] sm:px-2 sm:text-[11px]">
              <Warning size={10} weight="bold" />
              Urgent
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="text-right">
          <div className="font-display text-[14px] font-bold text-slate-900 sm:text-[16px]">
            {formatPriceCents(priceCents)}
          </div>
          <div className="hidden text-[11px] uppercase tracking-wider text-slate-400 sm:block">
            Prix du lead
          </div>
        </div>
        {primaryAction && (
          <Link
            href={primaryAction.href}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-white transition-colors",
              "px-2.5 py-1.5 text-[12px] font-semibold sm:px-4 sm:py-2 sm:text-[13.5px]",
              "bg-[#ea580c] hover:bg-[#c2410c]",
            )}
          >
            <span className="sm:hidden">Acheter</span>
            <span className="hidden sm:inline">{primaryAction.label}</span>
          </Link>
        )}
        {!primaryAction && secondaryAction && (
          <Link
            href={secondaryAction.href}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-[13.5px]"
          >
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function formatRelativeAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return `il y a ${Math.floor(days / 30)} mois`;
}
