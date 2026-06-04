import { Reveal } from "@/components/ds/Reveal";

type Row = {
  classicLead: string;
  classicTail: string;
  proLead: string;
  proTail: string;
};

const ROWS: ReadonlyArray<Row> = [
  {
    classicLead: "5 à 10",
    classicTail: "concurrents sur le même lead",
    proLead: "3 pros max",
    proTail: "par lead",
  },
  {
    classicLead: "Abonnements",
    classicTail: "mensuels obligatoires",
    proLead: "Sans engagement",
    proTail: "zéro frais fixes",
  },
  {
    classicLead: "Peu de contrôle",
    classicTail: "sur les leads reçus",
    proLead: "Auto-Accept intelligent",
    proTail: "et zones personnalisées",
  },
  {
    classicLead: "Leads revendus",
    classicTail: "massivement",
    proLead: "Contrôle total",
    proTail: "vous choisissez vos chantiers",
  },
];

export function ProComparison() {
  return (
    <section
      id="pourquoi-choisir"
      className="relative scroll-mt-20 lg:scroll-mt-24"
    >
      <div className="mx-auto max-w-[1350px] px-6 py-12 lg:py-20">
        <Reveal>
          <div className="mb-12 max-w-[680px]">
            <h2 className="font-display text-[32px] leading-[0.9] font-bold tracking-tight text-slate-900 sm:text-[38px] lg:text-[52px]">
              Une approche différente des plateformes classiques
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative grid gap-4 lg:grid-cols-2 lg:gap-8">
            {/* Plateformes classiques */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 text-center text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                Plateformes classiques
              </div>
              <ul className="divide-y divide-slate-100">
                {ROWS.map((row, i) => (
                  <li key={i} className="px-6 py-5">
                    <div className="text-[15px] font-semibold text-slate-900">
                      {row.classicLead}
                    </div>
                    <div className="mt-0.5 text-[13px] text-slate-500">
                      {row.classicTail}
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
                  <li key={i} className="px-6 py-5">
                    <div className="text-[15px] font-semibold text-white">
                      {row.proLead}
                    </div>
                    <div className="mt-0.5 text-[13px] text-white/70">
                      {row.proTail}
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
        </Reveal>
      </div>
    </section>
  );
}
