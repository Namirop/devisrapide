import { CheckCircle2, Lightbulb, TrendingUp, type LucideIcon } from "lucide-react";

type Tip = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const TIPS: Tip[] = [
  {
    icon: CheckCircle2,
    title: "Complétez votre profil à 100%",
    body: "Les pros avec un profil complet (catégories, zone, photo) reçoivent en moyenne 35% plus de leads.",
  },
  {
    icon: TrendingUp,
    title: "Répondez rapidement",
    body: "Les leads sont partagés entre 3 pros max. Le premier contact remporte souvent le chantier.",
  },
  {
    icon: Lightbulb,
    title: "Maintenez un bon taux de conversion",
    body: "Qualifiez vos leads (converti, sans suite, non joignable) pour aider la plateforme à mieux vous matcher.",
  },
];

export function TipsSection() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb
          className="h-4 w-4 text-[#ea580c]"
          strokeWidth={2}
          aria-hidden
        />
        <h2 className="text-[15px] font-bold text-slate-900">
          Conseils pour plus de leads
        </h2>
      </div>
      <ul className="flex flex-col gap-3">
        {TIPS.map((t) => {
          const Icon = t.icon;
          return (
            <li
              key={t.title}
              className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50/40 p-3"
            >
              <span
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white"
                aria-hidden
              >
                <Icon
                  className="h-[15px] w-[15px] text-[#1e3a8a]"
                  strokeWidth={2}
                />
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-slate-900">
                  {t.title}
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
                  {t.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      {/* Lien "Voir tous les conseils" inactif V1 (page conseils = V2,
          documenter dans v2-roadmap si pas deja). */}
    </section>
  );
}
