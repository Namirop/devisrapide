import Image from "next/image";

import { Reveal } from "@/components/ds/Reveal";
import { cn } from "@/lib/utils";

type Notif = {
  title: string;
  body: string;
  timestamp: string;
  dim?: boolean;
};

// 4 notifs nettes, espacees et legerement decalees (rythme), pas de
// chevauchement ni de flou : on suggere le flux d'opportunites par le volume,
// pas par une pile entassee. La 1re (dim) est juste un peu plus pale pour
// laisser deviner qu'il y en a "plus au-dessus". Ordre = ordre d'affichage
// haut->bas. Contenus varies (metiers/zones) facon vraie notif push.
const NOTIFS: ReadonlyArray<Notif> = [
  {
    title: "Pose · Châssis fenêtres",
    body: "Mons 7000 · à 12 km · Exclusif",
    timestamp: "il y a 12 min",
    dim: true,
  },
  {
    title: "Nouvelle demande · Toiture",
    body: "Charleroi 6000 · à 12 km · Exclusif",
    timestamp: "maintenant",
  },
  {
    title: "Dépannage urgent · Chauffage",
    body: "Liège 4000 · à 7 km · sous 24 h",
    timestamp: "il y a 3 min",
  },
  {
    title: "Nouvelle demande · Plomberie",
    body: "Namur 5000 · à 15 km · budget 2 200 €",
    timestamp: "il y a 8 min",
  },
];

export function ProNotifications() {
  return (
    <section className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:py-13">
        <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <Reveal>
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-slate-500 sm:text-[13px]">
                Notifications temps réel
              </span>
              <h2 className="font-display mt-3 text-[28px] font-bold leading-[1.05] tracking-tight text-slate-900 lg:text-[36px]">
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
            {/* Pile aeree : gaps reels (space-y-3), decalage horizontal alterne
                en lg (rythme), tout net. Pas d'absolute/overlap (illisible) ni
                de flou (brouillon). */}
            <div className="space-y-3">
              {NOTIFS.map((n, i) => (
                <NotificationCard
                  key={i}
                  n={n}
                  className={cn(
                    i % 2 === 0 ? "lg:translate-x-[12px]" : undefined,
                    n.dim && "opacity-60",
                  )}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// Notif "verre sombre" facon push iOS/Android : fond charbon translucide +
// backdrop-blur + bord froste clair. Logo PWA pose sur un carre blanc arrondi
// (icone d'app). 2 lignes calees sur la hauteur du logo, timestamp sur la
// ligne du titre. aria-hidden : visuel d'ambiance, pas de contenu pour l'AT.
function NotificationCard({
  n,
  className,
}: {
  n: Notif;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] bg-[#1c1c1e]/80 px-3.5 py-3 shadow-[0_16px_40px_-18px_rgba(2,6,23,0.5)] ring-1 ring-white/15 backdrop-blur-xl",
        className,
      )}
      aria-hidden
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-white shadow-sm">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="h-[82%] w-[82%] object-contain"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14.5px] font-semibold leading-tight text-white">
            {n.title}
          </span>
          <span className="shrink-0 text-[11px] text-white/45">
            {n.timestamp}
          </span>
        </div>
        <div className="mt-1 truncate text-[12.5px] leading-tight text-white/60">
          {n.body}
        </div>
      </div>
    </div>
  );
}
