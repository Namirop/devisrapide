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
  // Lead encore a 0 acheteur → prenable en exclusivite (badge informatif).
  isExclusiveAvailable?: boolean;
  // Lead parti (vendu / exclusif / offert) mais toujours affiche : la ligne
  // recule au lieu de disparaitre. Aucune action, aucun accent.
  taken?: boolean;
  takenLabel?: string;
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
  isExclusiveAvailable = false,
  taken = false,
  takenLabel = "Plus disponible",
}: Props) {
  // Sur une ligne prise, les signaux d'action (urgence orange, exclusivite,
  // CTA) n'ont plus de fonction : la ligne ne sert plus qu'a montrer que le
  // lead est parti. On les coupe plutot que de les afficher desactives.
  const isUrgent = urgency === "URGENT" && !taken;
  const ageLabel = formatRelativeAge(createdAt);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors sm:gap-5 sm:px-5 sm:py-4",
        taken ? "bg-slate-50/70" : "hover:bg-slate-50",
      )}
    >
      <span
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-lg sm:h-11 sm:w-11",
          taken ? "bg-slate-100" : "bg-blue-50",
        )}
        aria-hidden
      >
        <IconComp
          size={22}
          weight="regular"
          className={taken ? "text-slate-400" : "text-[#1e3a8a]"}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={cn(
              "truncate text-[13.5px] font-semibold sm:text-[14.5px]",
              taken ? "text-slate-500" : "text-slate-900",
            )}
          >
            {categoryName}
          </span>
          <span className="text-[11.5px] text-slate-400 sm:text-[12.5px]">
            ·
          </span>
          <span
            className={cn(
              "truncate text-[12.5px] sm:text-[13px]",
              taken ? "text-slate-400" : "text-slate-500",
            )}
          >
            {subCategoryName}
          </span>
        </div>
        <div
          className={cn(
            "mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] sm:gap-x-3 sm:text-[12.5px]",
            taken ? "text-slate-400" : "text-slate-500",
          )}
        >
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
          {isExclusiveAvailable && !taken && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-[#1e3a8a] sm:px-2 sm:text-[11px]">
              Exclusif dispo
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="text-right">
          <div
            className={cn(
              "font-display text-[14px] font-bold tabular-nums sm:text-[16px]",
              taken ? "text-slate-400" : "text-slate-900",
            )}
          >
            {formatPriceCents(priceCents)}
          </div>
          <div className="hidden text-[11px] uppercase tracking-wider text-slate-400 sm:block">
            Prix du lead
          </div>
        </div>
        {/* Slot d'action a largeur fixe sur desktop : sans lui, une ligne
            grisee (libelle court) decalerait sa colonne prix par rapport aux
            lignes avec bouton. */}
        {(taken || primaryAction || secondaryAction) && (
          <div className="flex justify-end sm:w-[152px]">
            {taken ? (
              <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[12px]">
                {takenLabel}
              </span>
            ) : primaryAction ? (
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
            ) : (
              secondaryAction && (
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-[13.5px]"
                >
                  {secondaryAction.label}
                </Link>
              )
            )}
          </div>
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
