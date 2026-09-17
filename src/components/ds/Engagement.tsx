import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

// « Notre engagement » : 3 chiffres sans card ni icône, avec une hiérarchie
// assumée (stat principale plus large et plus grande). Son fond desktop est
// bg-blue-50/30 : un slate-50 serait invisible sur le fond de la landing.

type Stat = { value: string; label: string; desc: string };

const STATS: readonly [Stat, Stat, Stat] = [
  {
    value: "100%",
    label: "Belge",
    desc: "Plateforme belge pensée et gérée en Belgique pour les particuliers et professionnels en Wallonie et à Bruxelles.",
  },
  {
    value: "3",
    label: "pros max par lead",
    desc: "Mise en concurrence saine sans vous submerger d'appels téléphoniques.",
  },
  {
    value: "BCE/TVA",
    label: "vérification",
    desc: "Numéro BCE et TVA vérifiés pour chaque artisan avant activation de son compte.",
  },
];

function StatBlock({ stat, lead = false }: { stat: Stat; lead?: boolean }) {
  return (
    <div>
      {/* Label à droite du chiffre, sur sa ligne de base. */}
      <div className="flex items-baseline gap-2.5">
        <div
          className={cn(
            "font-display font-bold leading-none tracking-tight tabular-nums text-slate-900",
            lead ? "text-[56px] lg:text-[96px]" : "text-[40px] lg:text-[56px]",
          )}
        >
          {stat.value}
        </div>
        <div className="text-[15px] font-semibold text-slate-500">
          {stat.label}
        </div>
      </div>
      <p className="max-w-[280px] text-[14.5px] leading-relaxed text-slate-600">
        {stat.desc}
      </p>
    </div>
  );
}

export function Engagement() {
  return (
    <section id="engagement" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-12 lg:pb-14 lg:pt-16">
        <Reveal>
          <h2 className="font-display text-[28px] font-bold tracking-tight lg:text-[34px]">
            <span className="text-slate-900">Notre </span>
            <span style={{ color: "#ea580c" }}>engagement</span>
          </h2>
        </Reveal>

        <Reveal delay={120}>
          {/* Mobile : liste séparée par des filets ; la stat principale
              garde un chiffre plus grand à la place du fond coloré. */}
          <div className="mt-8 divide-y divide-slate-200/70 lg:hidden">
            <div className="pb-6">
              <StatBlock stat={STATS[0]} lead />
            </div>
            <div className="py-6">
              <StatBlock stat={STATS[1]} />
            </div>
            <div className="pt-6">
              <StatBlock stat={STATS[2]} />
            </div>
          </div>

          {/* Desktop : colonnes asymétriques (flex 1.8 / 3). */}
          <div className="hidden lg:flex lg:flex-row lg:items-center lg:gap-6">
            <div className="rounded-2xl bg-blue-50/30 lg:flex-[1.8_1_0%] lg:p-10">
              <StatBlock stat={STATS[0]} lead />
            </div>

            {/* Colonnes 2 et 3 groupées : le trait se centre sur elles
                seules ; items-stretch aligne le haut des deux chiffres. */}
            <div className="flex flex-col gap-10 lg:flex-[3_1_0%] lg:flex-row lg:items-stretch lg:gap-10">
              {/* Colonne 2 plus étroite (0.8) : son contenu étant calé à
                  gauche, le trait se retrouve centré dans le vide entre les
                  deux stats au lieu de coller à la troisième. */}
              <div className="lg:flex-[0.8_1_0%]">
                <StatBlock stat={STATS[1]} />
              </div>
              <div
                className="hidden w-px self-center bg-slate-200 lg:block lg:h-24"
                aria-hidden
              />
              <div className="lg:flex-1">
                <StatBlock stat={STATS[2]} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
