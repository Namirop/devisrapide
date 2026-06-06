import Image from "next/image";

import { cn } from "@/lib/utils";

// Notification "lock screen" partagee entre la section ProNotifications et les
// notifs flottantes du hero pro (HeroNotifications). Contenu commun = icone PWA
// + titre/timestamp + body, texte blanc (pour fond NAVY). Deux fonds possibles :
//   - ProNotifications : glass pill (bg blanc translucide) posee sur le
//     wallpaper navy de la section (cf. NotificationPill) ;
//   - hero : notif navy AUTONOME, plus petite (cf. HeroNotifications, qui pose
//     NotificationContent directement sur un fond navy, sans container).
// aria-hidden gere par l'appelant : visuel d'ambiance, pas de contenu pour l'AT.

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

// Contenu nu d'une notif (sans fond) : icone PWA + titre/timestamp + body.
// `compact` reduit l'echelle pour le hero.
export function NotificationContent({
  n,
  compact = false,
}: {
  n: Notif;
  compact?: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "grid shrink-0 place-items-center bg-white shadow-sm",
          compact ? "h-8 w-8 rounded-[9px]" : "h-11 w-11 rounded-[12px]",
        )}
      >
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
          <span
            className={cn(
              "truncate font-semibold leading-tight text-white",
              compact ? "text-[12px]" : "text-[14px]",
            )}
          >
            {n.title}
          </span>
          <span
            className={cn(
              "shrink-0 text-white/45",
              compact ? "text-[10px]" : "text-[11px]",
            )}
          >
            {n.timestamp}
          </span>
        </div>
        <div
          className={cn(
            "mt-0.5 truncate leading-tight text-white/65",
            compact ? "text-[11px]" : "text-[12.5px]",
          )}
        >
          {n.body}
        </div>
      </div>
    </>
  );
}

// Glass pill pour fond navy (ProNotifications) : verre depoli clair pose sur le
// wallpaper de la section.
export function NotificationPill({ n }: { n: Notif }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[20px] bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
      aria-hidden
    >
      <NotificationContent n={n} />
    </div>
  );
}
