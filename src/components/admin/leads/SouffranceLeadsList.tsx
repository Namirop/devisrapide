import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "@phosphor-icons/react/dist/ssr";

import { formatPriceCents } from "@/lib/stats";

export type SouffranceLeadRow = {
  id: string;
  categoryName: string;
  subCategoryName: string;
  city: string;
  postalCode: string;
  priceCents: number;
  matchingStartedAt: Date | null;
};

type Props = {
  leads: SouffranceLeadRow[];
  totalCount: number;
};

/**
 * Section "Leads en souffrance" sur la home admin. Card englobante avec
 * bordure top 3px rouge #dc2626 — signal urgence admin (different de
 * l'orange "actionnable" du dashboard pro).
 *
 * Affiche jusqu'a 5 leads matchés depuis >2h sans aucun ACCEPTED. Le
 * bouton "Offrir ce lead" pointe vers /admin/leads/[id] ou l'action
 * "offrir gratis a un pro" est disponible (cf. C8 + C14).
 */
export function SouffranceLeadsList({ leads, totalCount }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Border-top 3px rouge = signal admin urgence */}
      <div
        className="h-[3px] w-full"
        style={{ backgroundColor: "#dc2626" }}
        aria-hidden
      />

      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-[18px] font-bold tracking-tight text-slate-900">
            Leads en souffrance
          </h2>
          {totalCount > 0 && (
            <span className="font-display rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-700">
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/admin/leads?onglet=en-souffrance"
          className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-medium text-[#1e3a8a] hover:underline"
        >
          Voir tous
          <ArrowRight size={14} weight="bold" />
        </Link>
      </header>

      {leads.length === 0 ? (
        <div className="px-5 pb-6 pt-2 text-[13px] text-slate-500">
          Aucun lead en souffrance pour le moment. Tous les leads recents
          sont en cours de matching ou deja achetes.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {leads.map((l) => (
            <li key={l.id}>
              <Link
                href={`/admin/leads/${l.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 sm:gap-5 sm:py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-slate-900 sm:text-[14.5px]">
                      {l.categoryName}
                    </span>
                    <span className="text-[11.5px] text-slate-400 sm:text-[12.5px]">
                      ·
                    </span>
                    <span className="truncate text-[12.5px] text-slate-500 sm:text-[13px]">
                      {l.subCategoryName}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-slate-500 sm:gap-x-3 sm:text-[12.5px]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} weight="regular" />
                      {l.postalCode} {l.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} weight="regular" />
                      {formatSouffranceAge(l.matchingStartedAt)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-[14px] font-bold text-slate-900 sm:text-[16px]">
                    {formatPriceCents(l.priceCents)}
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

function formatSouffranceAge(matchingStartedAt: Date | null): string {
  if (!matchingStartedAt) return "—";
  const ms = Date.now() - matchingStartedAt.getTime();
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} j depuis matching`;
  }
  return `${hours}h ${minutes}min depuis matching`;
}
