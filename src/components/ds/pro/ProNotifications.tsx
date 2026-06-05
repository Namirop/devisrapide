import Image from "next/image";

import { Reveal } from "@/components/ds/Reveal";

type Notif = {
  title: string;
  body: string;
  timestamp: string;
};

// 3 notifs facon vraie notif push, englobees dans UN SEUL container "verre
// depoli" facon Apple (bg translucide + backdrop-blur + bord clair). Deux
// halos colores derriere le container donnent au verre de la matiere a
// refracter (vibrance) sur le fond clair de la page.
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
            <div className="relative">
              {/* Halos colores derriere le verre = matiere a refracter
                  (vibrance facon Apple) sur le fond clair. */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div
                  className="absolute -right-4 -top-6 h-40 w-40 rounded-full blur-3xl"
                  style={{ backgroundColor: "rgba(30,58,138,0.30)" }}
                />
                <div
                  className="absolute -bottom-6 -left-4 h-36 w-36 rounded-full blur-3xl"
                  style={{ backgroundColor: "rgba(234,88,12,0.22)" }}
                />
              </div>

              {/* Container verre depoli englobant les 3 notifs. */}
              <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/55 p-2.5 shadow-[0_24px_70px_-26px_rgba(2,6,23,0.4)] backdrop-blur-2xl">
                <div className="divide-y divide-slate-200/50">
                  {NOTIFS.map((n, i) => (
                    <NotificationRow key={i} n={n} />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// Ligne de notif a l'interieur du container verre : logo PWA pose sur un carre
// blanc arrondi (icone d'app), titre + timestamp sur une ligne, body en
// dessous. aria-hidden : visuel d'ambiance, pas de contenu pour l'AT.
function NotificationRow({ n }: { n: Notif }) {
  return (
    <div className="flex items-center gap-3 px-2.5 py-3" aria-hidden>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-white shadow-sm ring-1 ring-slate-200/70">
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
          <span className="truncate text-[14px] font-semibold leading-tight text-slate-900">
            {n.title}
          </span>
          <span className="shrink-0 text-[11px] text-slate-400">
            {n.timestamp}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[12.5px] leading-tight text-slate-500">
          {n.body}
        </div>
      </div>
    </div>
  );
}
