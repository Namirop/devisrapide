import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Clock,
  MapPin,
  type LucideIcon,
} from "lucide-react";

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
  /** Si fourni : action principale (Acheter le lead). */
  primaryAction?: { label: string; href: string };
  /** Si fourni : action secondaire (Voir le détail). */
  secondaryAction?: { label: string; href: string };
  /** Icone catégorie. Défaut Briefcase si non fournie (V1, à enrichir
   *  avec un mapping cat→icon en Sprint 5 polish). */
  icon?: LucideIcon;
};

/**
 * Ligne lead affichee dans le dashboard home, la page /dashboard/leads et
 * la page /dashboard/mes-demandes. Une seule source de verite visuelle.
 *
 * Variants :
 * - primaryAction seul = action mise en avant (ex: "Acheter le lead")
 * - secondaryAction seul = pas d'action mise en avant (ex: detail)
 * - Les 2 = primary mis en avant, secondary discret
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
  icon: Icon = Briefcase,
}: Props) {
  const isUrgent = urgency === "URGENT";
  const ageLabel = formatRelativeAge(createdAt);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:flex-row sm:items-center sm:gap-5">
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50"
        aria-hidden
      >
        <Icon
          className="h-[20px] w-[20px] text-[#1e3a8a]"
          strokeWidth={1.75}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-semibold text-slate-900">
            {categoryName}
          </span>
          <span className="text-[12.5px] text-slate-400">·</span>
          <span className="truncate text-[13px] text-slate-500">
            {subCategoryName}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {postalCode} {city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {ageLabel}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#ea580c]">
              <AlertTriangle
                className="h-3 w-3"
                strokeWidth={2.5}
                aria-hidden
              />
              Urgent
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <div className="text-[15px] font-bold text-slate-900">
            {formatPriceCents(priceCents)}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400">
            Prix du lead
          </div>
        </div>
        {primaryAction && (
          <Link
            href={primaryAction.href}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-2 text-[13.5px] font-semibold text-white transition-colors",
              "bg-[#ea580c] hover:bg-[#c2410c]",
            )}
          >
            {primaryAction.label}
          </Link>
        )}
        {!primaryAction && secondaryAction && (
          <Link
            href={secondaryAction.href}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-[13.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/** "il y a X min" / "X h" / "X j". V1 simple, pas de i18n lib. */
function formatRelativeAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}
