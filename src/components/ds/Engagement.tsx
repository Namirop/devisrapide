import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

// "Notre engagement" — 3 stats nues editoriales : pas de card generale, pas
// d'icone, pas de bordure entre colonnes. Direction anti-ai-design-patterns §3
// (le chiffre porte le message, gros et nu) en remplacement de l'ancienne
// version "3 cards + icones orange".
//
// Hierarchie d'importance assumee pour casser le pattern "3 cellules egales" :
//   - Layout 40/30/30 (la stat principale prend plus de place)
//   - Chiffres 96 / 56 / 56 px (lg)
//   - Fond ultra-subtil bg-blue-50/30 sur la SEULE colonne 1 (slate-50 serait
//     invisible : la page entiere vit deja sur slate-50 — cf. page.tsx)
//   - Trait vertical decoratif entre col 2 et col 3 (desktop only)

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
      <div
        className={cn(
          "font-display font-bold leading-none tracking-tight tabular-nums text-slate-900",
          lead ? "text-[56px] lg:text-[96px]" : "text-[40px] lg:text-[56px]",
        )}
      >
        {stat.value}
      </div>
      <div className="mt-3 text-[15px] font-semibold text-slate-500">
        {stat.label}
      </div>
      <p className="mt-1 max-w-[280px] text-[14.5px] leading-relaxed text-slate-600">
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
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-10">
            {/* Col 1 — engagement principal : plus de place (40%), chiffre
                XXL et fond ultra-subtil qui se revele sans crier. */}
            <div className="rounded-2xl bg-blue-50/30 p-8 lg:flex-[2_1_0%] lg:p-10">
              <StatBlock stat={STATS[0]} lead />
            </div>

            {/* Col 2 + trait + Col 3 groupes : le trait se centre par rapport
                a ces deux colonnes, pas a la hauteur du bloc col 1.
                items-stretch -> les 2 chiffres partagent leur ligne du haut. */}
            <div className="flex flex-col gap-10 lg:flex-[3_1_0%] lg:flex-row lg:items-stretch lg:gap-10">
              <div className="lg:flex-1">
                <StatBlock stat={STATS[1]} />
              </div>
              {/* Trait vertical decoratif — desktop only, fin, ~2/3 de
                  hauteur, centre. Disparait sur mobile (colonnes empilees). */}
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
