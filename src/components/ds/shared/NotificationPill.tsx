import Image from "next/image";

// Notification "lock screen" partagee entre la section ProNotifications et les
// notifs flottantes du hero pro (HeroNotifications). Pastille de verre depoli
// clair (bg blanc translucide + backdrop-blur), logo PWA sur carre blanc, texte
// blanc : pensee pour etre posee sur un fond NAVY sombre (wallpaper ou chip).
// aria-hidden : visuel d'ambiance, pas de contenu pour l'AT.

export type Notif = {
  title: string;
  body: string;
  timestamp: string;
};

// Source unique des 3 notifs — partagee entre la section temps reel et le hero
// pour garder la coherence narrative (memes leads dans les deux endroits).
export const NOTIFS: ReadonlyArray<Notif> = [
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

export function NotificationPill({ n }: { n: Notif }) {
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
