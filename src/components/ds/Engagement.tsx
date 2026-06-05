import { Reveal } from "./Reveal";

// "Notre engagement" — 3 stats nues editoriales : pas de card, pas d'icone, pas
// de bordure entre colonnes, pas de fond colore. Direction
// anti-ai-design-patterns §3 (le chiffre porte le message, gros et nu) en
// remplacement de l'ancienne version "3 cards + icones orange" (patterns AI
// §2 cards symetriques / §5 accents / §6 icones decoratives).

type Stat = { value: string; label: string; desc: string };

const STATS: ReadonlyArray<Stat> = [
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
          <div className="mt-10 grid grid-cols-1 gap-10 sm:gap-8 lg:grid-cols-3 lg:gap-12">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-display text-[44px] font-bold leading-none tracking-tight tabular-nums text-slate-900 lg:text-[64px]">
                  {s.value}
                </div>
                <div className="mt-3 text-[15px] font-semibold text-slate-500">
                  {s.label}
                </div>
                <p className="mt-3 max-w-[280px] text-[14.5px] leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
