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
 * Stats strip : 4 blocs unifies dans un seul container plutot que 4 cards
 * empilees. Pattern "tableau de bord" plus dense et editorial.
 *
 * Layout :
 *   - Mobile : grid 2x2, borders internes croises (border-r sur cols 1-3,
 *     border-b sur row 1) pour delimiter sans gaspiller de hauteur.
 *   - Desktop (lg+) : grid 4x1 horizontal, border-l sur les 3 derniers.
 *   - Container parent : bg-white + border + rounded-lg + shadow-sm sur
 *     toutes les tailles.
 *
 * Typo :
 *   - Label en uppercase tracking-wide text-xs text-slate-500.
 *   - Valeur en font-display (Bricolage Grotesque via classe utility),
 *     text-3xl mobile / text-4xl lg / text-5xl xl, font-bold,
 *     text-slate-900.
 *   - Delta en badge inline-flex (icone TrendUp/Down + pourcentage +
 *     label sub), text-xs.
 *
 * Aucune icone decorative en haut a droite (volontaire — la maquette
 * avait des icones bulles qui parasitent la hierarchie typo).
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
  // Borders internes :
  //  - Mobile (grid 2x2) : border-r entre col 0 et 1 (blocs 0+2 → r),
  //    border-b entre row 0 et 1 (blocs 0+1 → b).
  //  - Desktop (grid 4x1) : border-l sur 1,2,3 (pas le 0).
  const mobileBorderR = index % 2 === 0 ? "border-r border-slate-200" : "";
  const mobileBorderB = index < 2 ? "border-b border-slate-200" : "";
  const desktopBorderL = index > 0 ? "lg:border-l lg:border-slate-200" : "";
  const desktopBorderB = "lg:border-b-0";
  // Reset des borders croisés sur desktop : seules les border-l comptent.
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
