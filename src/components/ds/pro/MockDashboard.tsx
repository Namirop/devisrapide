import type { Icon } from "@phosphor-icons/react";
import {
  CheckCircle,
  Clock,
  Gear,
  SquaresFour,
  Tray,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

// Mock dashboard pour le hero pro. Pas fonctionnel — juste visuel.
// Densite credible : sidebar gauche icones, header avec balance wallet,
// tableau central avec 3 leads fictifs utilisant les vrais codes postaux
// du seed BE (1000 Bruxelles, 4000 Liège, 5000 Namur).

type LeadRow = {
  category: string;
  postal: string;
  city: string;
  distanceKm: number;
  priceCents: number;
  variant: "exclusif" | "partage";
  status: "new" | "accepted";
};

const LEADS: LeadRow[] = [
  {
    category: "Toiture",
    postal: "1000",
    city: "Bruxelles",
    distanceKm: 8,
    priceCents: 10000,
    variant: "exclusif",
    status: "new",
  },
  {
    category: "Plomberie",
    postal: "4000",
    city: "Liège",
    distanceKm: 22,
    priceCents: 6500,
    variant: "partage",
    status: "new",
  },
  {
    category: "Chauffage",
    postal: "5000",
    city: "Namur",
    distanceKm: 35,
    priceCents: 4500,
    variant: "partage",
    status: "accepted",
  },
];

function formatEur(cents: number) {
  return `${Math.round(cents / 100)} €`;
}

export function MockDashboard() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
      {/* Browser chrome bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
        <span className="ml-3 text-[10px] font-medium text-slate-400">
          app.devisrapide.be/dashboard
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="flex w-12 flex-col items-center gap-3 border-r border-slate-200 bg-slate-50 py-4">
          {[
            { Icon: SquaresFour, active: true },
            { Icon: Tray, active: false },
            { Icon: Wallet, active: false },
            { Icon: Gear, active: false },
          ].map(({ Icon, active }, i) => (
            <NavIcon key={i} Icon={Icon} active={active} />
          ))}
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Tableau de bord
              </div>
              <div className="text-[13px] font-semibold text-slate-900">
                Bonjour, Sylvain
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <Wallet
                size={14}
                weight="regular"
                className="text-[#1e3a8a]"
                aria-hidden
              />
              <span className="text-[12px] font-semibold text-slate-900">
                284 €
              </span>
            </div>
          </div>

          {/* Leads table */}
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Leads à valider
              </div>
              <span className="text-[10px] text-slate-400">3 disponibles</span>
            </div>
            <div className="space-y-1.5">
              {LEADS.map((lead, i) => (
                <LeadCard key={i} lead={lead} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavIcon({ Icon, active }: { Icon: Icon; active: boolean }) {
  return (
    <span
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md",
        active
          ? "bg-[#1e3a8a] text-white"
          : "text-slate-400 hover:bg-slate-200/60",
      )}
      aria-hidden
    >
      <Icon size={14} weight="regular" />
    </span>
  );
}

function LeadCard({ lead }: { lead: LeadRow }) {
  const isAccepted = lead.status === "accepted";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border bg-white px-2.5 py-2",
        isAccepted ? "border-green-200/70" : "border-slate-200",
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-semibold",
          isAccepted
            ? "bg-green-50 text-[#16a34a]"
            : "bg-orange-50 text-[#ea580c]",
        )}
        aria-hidden
      >
        {isAccepted ? (
          <CheckCircle size={14} weight="bold" />
        ) : (
          <Clock size={14} weight="bold" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12px] font-semibold text-slate-900">
            {lead.category} · {lead.city}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>
            {lead.postal} · {lead.distanceKm} km
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-slate-300" aria-hidden />
          <span
            className={cn(
              "rounded-sm px-1 py-px font-medium",
              lead.variant === "exclusif"
                ? "bg-[#1e3a8a]/10 text-[#1e3a8a]"
                : "bg-slate-100 text-slate-600",
            )}
          >
            {lead.variant === "exclusif" ? "Exclusif 1 max" : "Partagé 3 max"}
          </span>
        </div>
      </div>
      <div className="text-[12px] font-bold tabular-nums text-slate-900">
        {formatEur(lead.priceCents)}
      </div>
    </div>
  );
}
