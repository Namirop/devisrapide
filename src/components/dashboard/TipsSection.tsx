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
    body: "Les pros avec un profil complet (catégories, zone, photo) reçoivent en moyenne 35% plus de leads.",
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
 * Conseils — refonte 2b redesign. Plus de card englobante. Titre
 * font-display + ligne decorative orange + grid 3 cols (1 col mobile)
 * de conseils flat (icone + titre + body court).
 */
export function TipsSection() {
  return (
    <section>
      <header className="mb-4">
        <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-900">
          Conseils pour plus de leads
        </h2>
        <div
          className="mt-2 h-[2px] w-8"
          style={{ backgroundColor: "#ea580c" }}
          aria-hidden
        />
      </header>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TIPS.map((t) => {
          const IconComp = t.icon;
          return (
            <li key={t.title} className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-50"
                aria-hidden
              >
                <IconComp
                  size={18}
                  weight="regular"
                  className="text-[#1e3a8a]"
                />
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-slate-900">
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
