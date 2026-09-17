import { TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { formatDeltaLabel, type DeltaResult } from "@/lib/stats";

type Stat = {
  label: string;
  value: string;
  sub?: string;
  delta?: DeltaResult;
};

type Props = {
  stats: [Stat, Stat, Stat, Stat];
};

/**
 * Quatre indicateurs dans un seul conteneur (grille 2×2 en mobile, 4×1 en
 * desktop) séparés par des bordures internes, plus dense que quatre cartes.
 * Pas d'icône décorative : la valeur porte la hiérarchie.
 */
export function StatsStrip({ stats }: Props) {
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
  // Mobile 2×2 : bordure droite sur la 1re colonne, basse sur la 1re ligne.
  // Desktop 4×1 : ces bordures sont annulées, seule la bordure gauche reste.
  const mobileBorderR = index % 2 === 0 ? "border-r border-slate-200" : "";
  const mobileBorderB = index < 2 ? "border-b border-slate-200" : "";
  const desktopBorderL = index > 0 ? "lg:border-l lg:border-slate-200" : "";
  const desktopBorderB = "lg:border-b-0";
  const desktopBorderRReset = "lg:border-r-0";

  const delta = stat.delta;
  const isPositive = delta?.kind === "delta" && delta.value > 0;
  const isNegative = delta?.kind === "delta" && delta.value < 0;
  const TrendIcon = isPositive ? TrendUp : isNegative ? TrendDown : null;

  return (
    <div
      className={cn(
        "p-4 lg:p-6",
        mobileBorderR,
        mobileBorderB,
        desktopBorderRReset,
        desktopBorderB,
        desktopBorderL,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
        {stat.label}
      </p>
      <p className="font-display mt-2 text-3xl font-bold leading-none tracking-tight text-slate-900 lg:text-4xl xl:text-5xl">
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
        {stat.sub && <span className="text-slate-500">{stat.sub}</span>}
      </div>
    </div>
  );
}
