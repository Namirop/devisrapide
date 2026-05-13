import { Bell } from "@phosphor-icons/react/dist/ssr";

// Notification flottante "Nouveau lead" — placardee a cote du mock dashboard
// dans le hero pro. Pas fonctionnelle, juste un visuel d'ambiance.

type Props = {
  category: string;
  city: string;
  distanceKm: number;
  priceCents: number;
  exclusif?: boolean;
};

export function MockNotification({
  category,
  city,
  distanceKm,
  priceCents,
  exclusif = false,
}: Props) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-lg"
      aria-hidden
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
        style={{ backgroundColor: "#ea580c" }}
      >
        <Bell size={16} weight="bold" className="text-white" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ea580c]">
            Nouveau lead
          </span>
          <span className="text-[10px] text-slate-400">maintenant</span>
        </div>
        <div className="mt-0.5 text-[13px] font-semibold text-slate-900">
          {category} · {city}
        </div>
        <div className="text-[11px] text-slate-500">
          {distanceKm} km · {Math.round(priceCents / 100)} €
          {exclusif && (
            <span className="ml-1.5 rounded-sm bg-[#1e3a8a]/10 px-1 py-px text-[10px] font-medium text-[#1e3a8a]">
              Exclusif
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
