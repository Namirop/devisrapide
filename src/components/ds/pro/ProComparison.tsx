import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsClockwise,
  FunnelSimple,
  Shuffle,
  Users,
} from "@phosphor-icons/react/dist/ssr";

type Row = {
  Icon: Icon;
  classicLead: string;
  classicTail: string;
  proLead: string;
  proTail: string;
};

const ROWS: ReadonlyArray<Row> = [
  {
    Icon: Users,
    classicLead: "5 à 10",
    classicTail: "concurrents sur le même lead",
    proLead: "3 pros max",
    proTail: "par lead",
  },
  {
    Icon: ArrowsClockwise,
    classicLead: "Abonnements",
    classicTail: "mensuels obligatoires",
    proLead: "Sans engagement",
    proTail: "zéro frais fixes",
  },
  {
    Icon: FunnelSimple,
    classicLead: "Peu de contrôle",
    classicTail: "sur les leads reçus",
    proLead: "Auto-Accept intelligent",
    proTail: "et zones personnalisées",
  },
  {
    Icon: Shuffle,
    classicLead: "Leads revendus",
    classicTail: "massivement",
    proLead: "Contrôle total",
    proTail: "vous choisissez vos chantiers",
  },
];

export function ProComparison() {
  return (
    <section id="pourquoi-choisir" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1100px] px-6 py-16 lg:py-20">
        <div className="mb-12 text-center">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "#ea580c" }}
          >
            Pourquoi choisir DevisRapide
          </span>
          <h2 className="font-display mt-3 text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
            Une approche différente des plateformes classiques
          </h2>
        </div>

        <div className="relative grid gap-4 lg:grid-cols-2 lg:gap-8">
          {/* Plateformes classiques */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 text-center text-[12px] font-semibold uppercase tracking-wider text-slate-500">
              Plateformes classiques
            </div>
            <ul className="divide-y divide-slate-100">
              {ROWS.map((row, i) => (
                <li key={i} className="flex items-center gap-4 px-6 py-5">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100"
                    aria-hidden
                  >
                    <row.Icon
                      size={18}
                      weight="regular"
                      className="text-slate-500"
                    />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[15px] font-semibold text-slate-900">
                      {row.classicLead}
                    </div>
                    <div className="mt-0.5 text-[13px] text-slate-500">
                      {row.classicTail}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* DevisRapide */}
          <div
            className="overflow-hidden rounded-2xl shadow-sm"
            style={{ backgroundColor: "#1e3a8a" }}
          >
            <div className="border-b border-white/15 px-6 py-4 text-center text-[12px] font-semibold uppercase tracking-wider text-white">
              DevisRapide
            </div>
            <ul className="divide-y divide-white/10">
              {ROWS.map((row, i) => (
                <li key={i} className="flex items-center gap-4 px-6 py-5">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10"
                    aria-hidden
                  >
                    <row.Icon
                      size={18}
                      weight="regular"
                      className="text-white"
                    />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[15px] font-semibold text-white">
                      {row.proLead}
                    </div>
                    <div className="mt-0.5 text-[13px] text-white/70">
                      {row.proTail}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* VS badge — centered between the two cards on desktop */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <div
              className="grid h-12 w-12 place-items-center rounded-full text-[12px] font-bold tracking-wider text-white shadow-lg ring-4 ring-slate-50"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              VS
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
