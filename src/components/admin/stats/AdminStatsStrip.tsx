import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { formatDeltaLabel, type DeltaResult } from "@/lib/stats";

type Stat = {
  label: string;
  value: string;
  sub?: string;
  delta?: DeltaResult;
  /**
   * Flag urgence admin : si true, bloc rendered avec accent rouge
   * attenue (bg-rose-50 + text rose-700 sur la valeur). Utilise pour
   * le 4e bloc "Leads non achetes" quand count > 0.
   */
  urgent?: boolean;
};

type Props = {
  stats: [Stat, Stat, Stat, Stat];
};

/**
 * Variant admin de StatsStrip : identique au composant dashboard pro
 * mais accepte un flag `urgent` par bloc pour signal admin (rouge
 * attenue). Volontairement duplique au lieu d'etendre StatsStrip pour
 * eviter de toucher le composant Sprint 2b (hors perimetre Sprint 4).
 */
export function AdminStatsStrip({ stats }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Block key={s.label} stat={s} index={i} />
        ))}
      </div>
    </div>
  );
}

function Block({ stat, index }: { stat: Stat; index: number }) {
  const mobileBorderR = index % 2 === 0 ? "border-r border-slate-200" : "";
  const mobileBorderB = index < 2 ? "border-b border-slate-200" : "";
  const desktopBorderL = index > 0 ? "lg:border-l lg:border-slate-200" : "";
  const desktopBorderB = "lg:border-b-0";
  const desktopBorderRReset = "lg:border-r-0";

  const delta = stat.delta;
  const isPositive = delta?.kind === "delta" && delta.value > 0;
  const isNegative = delta?.kind === "delta" && delta.value < 0;
  const TrendIcon = isPositive ? TrendUp : isNegative ? TrendDown : null;
  const urgent = stat.urgent ?? false;

  return (
    <div
      className={cn(
        "p-4 lg:p-6",
        urgent && "bg-rose-50/60",
        mobileBorderR,
        mobileBorderB,
        desktopBorderRReset,
        desktopBorderB,
        desktopBorderL,
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.1em]",
          urgent ? "text-rose-700" : "text-slate-500",
        )}
      >
        {stat.label}
      </p>
      <p
        className={cn(
          "font-display mt-2 text-3xl font-bold leading-none tracking-tight lg:text-4xl xl:text-5xl",
          urgent ? "text-rose-700" : "text-slate-900",
        )}
      >
        {stat.value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
        {delta && delta.kind !== "none" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
              isPositive && "bg-emerald-50 text-emerald-700",
              isNegative && "bg-rose-50 text-rose-700",
              delta.kind === "new" && "bg-blue-50 text-[#1e3a8a]",
            )}
          >
            {TrendIcon && <TrendIcon size={12} weight="bold" />}
            {formatDeltaLabel(delta)}
          </span>
        )}
        {stat.sub && (
          <span className={urgent ? "text-rose-700" : "text-slate-500"}>
            {stat.sub}
          </span>
        )}
      </div>
    </div>
  );
}
