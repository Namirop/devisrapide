import { Activity } from "lucide-react";

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

export function RecentActivity({ items }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity
          className="h-4 w-4 text-[#1e3a8a]"
          strokeWidth={2}
          aria-hidden
        />
        <h2 className="text-[15px] font-bold text-slate-900">
          Activité récente
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-slate-500">
          Pas encore d&apos;activité. Vos achats de leads et transactions
          apparaîtront ici.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.iconBg}`}
                  aria-hidden
                >
                  <Icon
                    className={`h-[15px] w-[15px] ${item.iconColor}`}
                    strokeWidth={2}
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
                  <span className="shrink-0 text-[13px] font-semibold text-slate-700">
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
