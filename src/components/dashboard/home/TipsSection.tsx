import type { Icon } from "@phosphor-icons/react";
import {
  CheckCircle,
  Lightbulb,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";

type Tip = {
  icon: Icon;
  title: string;
  body: string;
};

const TIPS: Tip[] = [
  {
    icon: CheckCircle,
    title: "Complétez votre profil à 100%",
    body: "Les pros avec un profil complet (catégories, zone, description) reçoivent en moyenne 35% plus de leads.",
  },
  {
    icon: TrendUp,
    title: "Répondez rapidement",
    body: "Les leads sont partagés entre 3 pros max. Le premier contact remporte souvent le chantier.",
  },
  {
    icon: Lightbulb,
    title: "Maintenez un bon taux de conversion",
    body: "Qualifiez vos leads (converti, sans suite, non joignable) pour aider la plateforme à mieux vous matcher.",
  },
];

/**
 * Conseils pour plus de leads — feed vertical en card flat. Harmonise avec
 * RecentActivity (meme containers d'icone h-9 w-9 rounded-lg bg-blue-50,
 * meme rythme d'items, meme structure de header).
 */
export function TipsSection() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full bg-[#ea580c]"
          aria-hidden
        />
        <h2 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
          Conseils pour plus de leads
        </h2>
      </header>
      <ul className="flex flex-col">
        {TIPS.map((t) => {
          const IconComp = t.icon;
          return (
            <li
              key={t.title}
              className="flex items-start gap-3 border-t border-slate-100 py-3 first:border-0 first:pt-0 last:pb-0"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50"
                aria-hidden
              >
                <IconComp
                  size={18}
                  weight="regular"
                  className="text-[#1e3a8a]"
                />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="text-[13.5px] font-semibold text-slate-900">
                  {t.title}
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                  {t.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
