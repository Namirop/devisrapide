import type { ActivityItem } from "@/server/queries/recent-activity";

type Props = {
  items: ActivityItem[];
};

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} j`;
  return `${Math.floor(days / 30)} mois`;
}

/**
 * Activite recente — refonte 2b redesign. Plus de card englobante : titre
 * font-display + ligne decorative orange 32px + flux d'items en colonne.
 *
 * Note : ActivityItem porte une LucideIcon en prop (legacy Sprint 2b
 * recent-activity query). On la rend comme avant ici, le swap lucide
 * → phosphor cote query sera fait dans un commit suivant si le pattern
 * complet est valide visuellement par Romain.
 */
export function RecentActivity({ items }: Props) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="font-display text-[20px] font-bold tracking-tight text-slate-900">
          Activité récente
        </h2>
        <div
          className="mt-2 h-[2px] w-8"
          style={{ backgroundColor: "#ea580c" }}
          aria-hidden
        />
      </header>

      {items.length === 0 ? (
        <p className="text-[13px] text-slate-500">
          Pas encore d&apos;activité. Vos achats de leads et transactions
          apparaîtront ici.
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.iconBg}`}
                  aria-hidden
                >
                  <Icon
                    size={15}
                    weight="regular"
                    className={item.iconColor}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-slate-900">
                    {item.label}
                  </div>
                  <div className="text-[11.5px] text-slate-400">
                    il y a {formatRelative(item.at)}
                  </div>
                </div>
                {item.trailing && (
                  <span className="shrink-0 font-display text-[13px] font-bold text-slate-700">
                    {item.trailing}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
