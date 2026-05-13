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
 * Activite recente — feed vertical en card flat. Harmonise avec
 * TipsSection (meme containers d'icone h-9 w-9 rounded-lg, meme rythme
 * d'items, meme structure de header).
 */
export function RecentActivity({ items }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full bg-[#ea580c]"
          aria-hidden
        />
        <h2 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
          Activité récente
        </h2>
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
                className="flex items-start gap-3 border-t border-slate-100 py-3 first:border-0 first:pt-0 last:pb-0"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.iconBg}`}
                  aria-hidden
                >
                  <Icon
                    size={18}
                    weight="regular"
                    className={item.iconColor}
                  />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-[13.5px] font-medium text-slate-900">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-slate-400">
                    il y a {formatRelative(item.at)}
                  </div>
                </div>
                {item.trailing && (
                  <span className="shrink-0 pt-0.5 font-display text-[13px] font-bold text-slate-700">
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
