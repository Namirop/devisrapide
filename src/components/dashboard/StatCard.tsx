import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDeltaLabel, type DeltaResult } from "@/lib/stats";

type Props = {
  label: string;
  value: string;
  sub?: string;
  delta?: DeltaResult;
  icon?: LucideIcon;
  iconBg?: string; // bg-class tailwind ou couleur hex
  iconColor?: string;
};

/**
 * Card stat reutilisable pour les 4 cards top du dashboard et les widgets
 * du dashboard. Visuel sobre, pas de chart V1 (cf. v2-roadmap pour les
 * sparklines apres upgrade observability).
 *
 * delta : si fourni, affiche +X% / -X% / "Nouveau" / "—" selon le retour
 *         de computeDeltaPercent. Couleur green/red selon le signe.
 */
export function StatCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
}: Props) {
  const deltaPositive = delta?.kind === "delta" && delta.value > 0;
  const deltaNegative = delta?.kind === "delta" && delta.value < 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 text-[24px] font-bold leading-none tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        {Icon && (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
              iconBg,
            )}
            aria-hidden
          >
            <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12.5px]">
        {delta && (
          <span
            className={cn(
              "font-semibold",
              deltaPositive && "text-emerald-600",
              deltaNegative && "text-rose-600",
              delta.kind === "new" && "text-[#1e3a8a]",
              delta.kind === "none" && "text-slate-400",
              !deltaPositive && !deltaNegative && delta.kind === "delta"
                ? "text-slate-500"
                : "",
            )}
          >
            {formatDeltaLabel(delta)}
          </span>
        )}
        {sub && <span className="text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}
