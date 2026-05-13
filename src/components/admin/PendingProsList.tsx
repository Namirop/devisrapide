import Link from "next/link";
import { ArrowRight, Buildings } from "@phosphor-icons/react/dist/ssr";

export type PendingProRow = {
  proProfileId: string;
  companyName: string;
  vatNumber: string | null;
  createdAt: Date;
};

type Props = {
  pros: PendingProRow[];
  totalCount: number;
};

/**
 * Section "Pros en attente de validation" sur la home admin. Card avec
 * bordure top 3px orange (action cote admin = neutre, similaire au
 * pattern dashboard pro).
 *
 * Affiche jusqu'a 5 pros PENDING tries par anciennete. Click sur une
 * ligne → /admin/professionnels/[id] ou les actions Valider/Refuser
 * vivent (cf. C10 + C13).
 */
export function PendingProsList({ pros, totalCount }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Border-top 3px orange = signal admin actionnable (sans urgence) */}
      <div
        className="h-[3px] w-full"
        style={{ backgroundColor: "#ea580c" }}
        aria-hidden
      />

      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
            Pros en attente
          </h2>
          {totalCount > 0 && (
            <span className="font-display rounded-full bg-orange-50 px-2.5 py-0.5 text-[12px] font-bold text-[#ea580c]">
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/admin/professionnels?onglet=en-attente"
          className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium text-[#1e3a8a] hover:underline"
        >
          Voir tous
          <ArrowRight size={14} weight="bold" />
        </Link>
      </header>

      {pros.length === 0 ? (
        <div className="px-5 pb-6 pt-2 text-[13px] text-slate-500">
          Aucune candidature en attente. Tous les pros ont ete traites.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pros.map((p) => (
            <li key={p.proProfileId}>
              <Link
                href={`/admin/professionnels/${p.proProfileId}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 sm:gap-5 sm:py-4"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50"
                  aria-hidden
                >
                  <Buildings
                    size={20}
                    weight="regular"
                    className="text-[#1e3a8a]"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-slate-900">
                    {p.companyName}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
                    <span>{p.vatNumber ?? "TVA non renseignée"}</span>
                    <span>· Inscrit {formatAge(p.createdAt)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatAge(date: Date): string {
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / (60 * 1000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
