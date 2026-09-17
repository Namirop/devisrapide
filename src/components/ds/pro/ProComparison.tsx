import { Logo } from "@/components/ds/Logo";
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
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:py-13">
        <Reveal>
          <div className="mb-12">
            <h2 className="font-display text-[28px] leading-[0.9] font-bold tracking-tight text-slate-900 lg:text-[36px]">
              Une approche différente des plateformes{" "}
              <span style={{ color: "#ea580c" }}>classiques</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative grid gap-4 lg:grid-cols-2 lg:gap-8">
            {/* Wrapper relatif : ancre le badge VS mobile entre les deux
                cards empilées. */}
            <div className="relative">
              <div
                className="overflow-hidden rounded-2xl shadow-sm"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                <div className="flex min-h-[64px] items-center justify-center border-b border-white/15 px-6 text-center text-[12px] font-semibold uppercase tracking-wider text-white">
                  Plateformes classiques
                </div>
                <ul className="divide-y divide-white/10">
                  {ROWS.map((row, i) => (
                    <li
                      key={i}
                      className="px-8 py-3.5 transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="text-[22px] font-semibold text-white">
                        {row.classicLead}
                      </div>
                      <div className="text-[14.5px] text-white/70">
                        {row.classicTail}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Badge VS mobile, hors de la card dont l'overflow-hidden le
                  couperait ; remplacé en desktop par le badge centré. */}
              <div
                aria-hidden
                className="absolute -bottom-7 left-1/2 z-10 -translate-x-1/2 lg:hidden"
              >
                <div
                  className="grid h-11 w-11 place-items-center rounded-full text-[11px] font-bold tracking-wider text-white shadow-lg ring-4 ring-slate-50"
                  style={{ backgroundColor: "#1e3a8a" }}
                >
                  VS
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* translate-y-[6px] compense le décalage vers le haut du logo
                  « brand » (BRAND_NUDGE_Y) pour le centrer dans l'en-tête. */}
              <div className="flex min-h-[64px] items-center justify-center border-b border-slate-200 bg-slate-50 px-6">
                <div className="translate-y-[6px]">
                  <Logo variant="brand" size={36} href={null} />
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {ROWS.map((row, i) => (
                  <li
                    key={i}
                    className="px-8 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="text-[22px] font-semibold text-slate-900">
                      {row.proLead}
                    </div>
                    <div className="text-[14.5px] text-slate-500">
                      {row.proTail}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Badge VS desktop, centré entre les deux cards. */}
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
