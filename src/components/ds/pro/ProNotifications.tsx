import type { Icon } from "@phosphor-icons/react";
import { Flame, House, Wrench } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";
import { cn } from "@/lib/utils";

type Notif = {
  category: string;
  city: string;
  postal: string;
  distanceKm: number;
  Icon: Icon;
  badge?: { label: string; tone: "exclusif" | "urgent" | "budget" };
  budgetEur?: number;
};

const NOTIFS: ReadonlyArray<Notif> = [
  {
    category: "Toiture — Rénovation complète",
    city: "Charleroi",
    postal: "6000",
    distanceKm: 12,
    Icon: House,
    badge: { label: "Exclusif x2.5", tone: "exclusif" },
  },
  {
    category: "Chauffage — Dépannage urgent",
    city: "Liège",
    postal: "4000",
    distanceKm: 7,
    Icon: Flame,
    badge: { label: "Urgence 24/7", tone: "urgent" },
  },
  {
    category: "Plomberie — Rénovation salle de bain",
    city: "Namur",
    postal: "5000",
    distanceKm: 15,
    Icon: Wrench,
    budgetEur: 15000,
    badge: { label: "Budget 15 000 €", tone: "budget" },
  },
];

export function ProNotifications() {
  return (
    <section className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1350px] px-6 py-12 lg:py-13">
        <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <Reveal>
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-slate-500 sm:text-[13px]">
              Notifications temps réel
            </span>
            <h2 className="font-display mt-3 text-[32px] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-[38px] lg:text-[52px]">
              Ne ratez aucune{" "}
              <span style={{ color: "#ea580c" }}>opportunité</span>
            </h2>
            <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-slate-600">
              Une demande matchant votre zone et votre métier ? Notification
              instantanée sur votre téléphone. Réactivité = chantier remporté.
            </p>
            <ul className="mt-6 space-y-2 text-[13.5px] text-slate-600">
              <li>· Alerte push native iOS / Android (PWA installable)</li>
              <li>· Email backup si push indisponible</li>
              <li>· Mode Auto-Accept pour ne jamais rater un lead</li>
            </ul>
          </div>
          </Reveal>

          <Reveal delay={120}>
          <div className="space-y-3">
            {NOTIFS.map((n, i) => (
              <NotificationCard key={i} {...n} />
            ))}
          </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function NotificationCard({
  category,
  city,
  postal,
  distanceKm,
  Icon,
  badge,
}: Notif) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl bg-[#0f1e3d] px-4 py-3.5 shadow-md"
      aria-hidden
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md"
        style={{ backgroundColor: "#ea580c" }}
      >
        <Icon size={18} weight="regular" className="text-white" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            DevisRapide · Nouveau lead
          </span>
          <span className="text-[10px] text-white/50">maintenant</span>
        </div>
        <div className="mt-1 text-[14px] font-semibold text-white">
          {category}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-white/70">
          <span>
            {postal} {city} · {distanceKm} km
          </span>
          {badge && (
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                badge.tone === "exclusif" && "bg-white/10 text-[#fb923c]",
                badge.tone === "urgent" && "bg-[#ea580c] text-white",
                badge.tone === "budget" && "bg-white/10 text-white/90",
              )}
            >
              {badge.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
