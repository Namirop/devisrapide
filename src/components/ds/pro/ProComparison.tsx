import { Users, RotateCw, Filter, Shuffle, type LucideIcon } from "lucide-react";

// Comparatif "Plateformes classiques vs DevisRapide".
// 4 lignes, layout 2 cols sur desktop. Icones lucide sobres a gauche de
// chaque cote (slate pour classique, navy pour DevisRapide). Pas de check
// vert / croix rouge flashy.

type Row = {
  Icon: LucideIcon;
  classic: string;
  devisrapide: string;
};

const ROWS: ReadonlyArray<Row> = [
  {
    Icon: Users,
    classic: "5 à 10 concurrents sur le même lead",
    devisrapide: "3 pros maximum par lead",
  },
  {
    Icon: RotateCw,
    classic: "Abonnements mensuels obligatoires",
    devisrapide: "Sans engagement, zéro frais fixes",
  },
  {
    Icon: Filter,
    classic: "Peu de contrôle sur les leads reçus",
    devisrapide: "Auto-Accept intelligent et zones personnalisées",
  },
  {
    Icon: Shuffle,
    classic: "Leads revendus massivement",
    devisrapide: "Contrôle total, vous choisissez vos chantiers",
  },
];

export function ProComparison() {
  return (
    <section className="relative scroll-mt-24 bg-slate-50">
      <div className="mx-auto max-w-[1350px] px-6 py-16 lg:py-20">
        <div className="mb-10 text-center">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "#ea580c" }}
          >
            Pourquoi choisir DevisRapide
          </span>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
            Une approche différente des plateformes classiques
          </h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-2">
            <div className="border-b border-r border-slate-200 bg-slate-50/50 px-5 py-4 text-center text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              Plateformes classiques
            </div>
            <div
              className="border-b border-slate-200 px-5 py-4 text-center text-[12px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              DevisRapide
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => {
            const isLast = i === ROWS.length - 1;
            return (
              <div key={i} className="grid grid-cols-2">
                <Cell
                  Icon={row.Icon}
                  text={row.classic}
                  variant="classic"
                  isLast={isLast}
                />
                <Cell
                  Icon={row.Icon}
                  text={row.devisrapide}
                  variant="devisrapide"
                  isLast={isLast}
                />
              </div>
            );
          })}
        </div>

        {/* VS badge centred between cols, visible desktop only */}
        <div
          aria-hidden
          className="pointer-events-none -mt-[calc(50%+12px)] hidden h-full lg:flex lg:justify-center"
        />
      </div>
    </section>
  );
}

function Cell({
  Icon,
  text,
  variant,
  isLast,
}: {
  Icon: LucideIcon;
  text: string;
  variant: "classic" | "devisrapide";
  isLast: boolean;
}) {
  const isPro = variant === "devisrapide";
  return (
    <div
      className={`flex items-start gap-3 px-5 py-5 lg:px-6 lg:py-6 ${
        isLast ? "" : "border-b border-slate-200"
      } ${isPro ? "" : "border-r border-slate-200"}`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
          isPro ? "bg-blue-50" : "bg-slate-100"
        }`}
        aria-hidden
      >
        <Icon
          className={`h-[18px] w-[18px] ${
            isPro ? "text-[#1e3a8a]" : "text-slate-500"
          }`}
          strokeWidth={1.75}
        />
      </span>
      <span
        className={`pt-1 text-[14px] leading-snug ${
          isPro ? "font-medium text-slate-900" : "text-slate-600"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
