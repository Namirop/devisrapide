import Image from "next/image";

import { Reveal } from "@/components/ds/Reveal";

type Notif = {
  title: string;
  body: string;
  timestamp: string;
};

// 3 notifs facon lock screen iOS : un container "wallpaper" navy sombre (avec
// halos colores pour la profondeur), et les notifs posees dessus en pastilles
// de verre depoli clair (bg blanc translucide + backdrop-blur, texte blanc).
// Pas de cadre de telephone (refuse) : juste le panneau + les notifs.
const NOTIFS: ReadonlyArray<Notif> = [
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
        {/* Mockup a GAUCHE, texte a DROITE en desktop (via order) ; sur mobile
            le DOM order prime → texte d'abord (en haut), mockup ensuite. */}
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <Reveal className="lg:order-2">
            {/* Bloc texte ancre a droite (ml-auto) avec largeur bornee : il
                "colle" au bord droit, l'espace respire entre mockup et texte. */}
            <div className="lg:ml-auto lg:max-w-[480px]">
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

          <Reveal delay={120} className="lg:order-1">
            {/* Container "wallpaper" sombre facon lock screen. */}
            <div
              className="relative overflow-hidden rounded-[28px] p-3.5 shadow-[0_30px_80px_-30px_rgba(2,6,23,0.65)]"
              style={{
                backgroundImage:
                  "linear-gradient(155deg, #1e3a8a 0%, #15285f 45%, #0b1733 100%)",
              }}
            >
              {/* Halos colores = profondeur du wallpaper, refractes par le
                  backdrop-blur des pastilles posees dessus. */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div
                  className="absolute -right-8 -top-10 h-44 w-44 rounded-full blur-3xl"
                  style={{ backgroundColor: "rgba(96,165,250,0.40)" }}
                />
                <div
                  className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full blur-3xl"
                  style={{ backgroundColor: "rgba(234,88,12,0.30)" }}
                />
              </div>

              <div className="relative space-y-2.5">
                {NOTIFS.map((n, i) => (
                  <NotificationPill key={i} n={n} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// Pastille de notif posee sur le wallpaper : verre depoli clair (bg blanc
// translucide + backdrop-blur + bord clair), logo PWA sur carre blanc, texte
// blanc. aria-hidden : visuel d'ambiance, pas de contenu pour l'AT.
function NotificationPill({ n }: { n: Notif }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[20px] bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
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
          <span className="truncate text-[14px] font-semibold leading-tight text-white">
            {n.title}
          </span>
          <span className="shrink-0 text-[11px] text-white/45">
            {n.timestamp}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[12.5px] leading-tight text-white/65">
          {n.body}
        </div>
      </div>
    </div>
  );
}
