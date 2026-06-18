import type { Icon } from "@phosphor-icons/react";
import { Clock, ShieldCheck, Star, Users } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

// Bandeau de réassurance sous la card du tunnel (présent sur les 3 étapes,
// cf. maquettes docs/tunnel). Signaux de confiance, scannables d'un coup
// d'œil. DA : icônes muted, un seul accent orange (pros vérifiés).
type TrustItem = {
  Icon: Icon;
  title: string;
  subtitle: string;
  accent?: boolean;
};

const TRUST_ITEMS: ReadonlyArray<TrustItem> = [
  {
    Icon: ShieldCheck,
    title: "Sécurisé",
    subtitle: "Vos données sont protégées",
  },
  {
    Icon: Users,
    title: "Jusqu'à 3 devis",
    subtitle: "Comparez et choisissez",
  },
  {
    Icon: Clock,
    title: "Réponse rapide",
    subtitle: "Sous 24 à 48h en moyenne",
  },
  {
    Icon: Star,
    title: "Professionnels vérifiés",
    subtitle: "Des experts de confiance",
    accent: true,
  },
];

export function TrustBanner() {
  return (
    // gap-px + fond slate sous des cellules slate-50 = filets de séparation
    // fins, sans bordures internes lourdes.
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200/70 sm:grid-cols-4">
      {TRUST_ITEMS.map(({ Icon, title, subtitle, accent }) => (
        <div
          key={title}
          className="flex items-center gap-3 bg-slate-50 px-4 py-4"
        >
          <Icon
            size={22}
            weight={accent ? "fill" : "regular"}
            className={cn(
              "shrink-0",
              accent ? "text-[#ea580c]" : "text-slate-400",
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900">{title}</p>
            <p className="text-[12px] leading-tight text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
