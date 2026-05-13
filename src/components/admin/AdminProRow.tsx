import Link from "next/link";
import { Eye } from "@phosphor-icons/react/dist/ssr";
import type { ProValidationStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/stats";
import type { AdminProRow as Row } from "@/server/queries/admin-pros";

type Props = {
  pro: Row;
};

const STATUS_META: Record<
  ProValidationStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "En attente", bg: "bg-orange-50", text: "text-[#ea580c]" },
  VALIDATED: { label: "Validé", bg: "bg-emerald-50", text: "text-emerald-700" },
  SUSPENDED: { label: "Suspendu", bg: "bg-rose-50", text: "text-rose-700" },
  REJECTED: { label: "Refusé", bg: "bg-slate-100", text: "text-slate-600" },
};

/**
 * Ligne de la liste /admin/professionnels. Click → detail
 * /admin/professionnels/[id] ou les actions admin sont dispo.
 */
export function AdminProRow({ pro }: Props) {
  const meta = STATUS_META[pro.validationStatus];
  const initials = computeInitials(pro.companyName);

  return (
    <Link
      href={`/admin/professionnels/${pro.proProfileId}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:gap-5 sm:px-5 sm:py-4"
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#1a1f2e] text-[12.5px] font-semibold text-white"
        aria-hidden
      >
        {initials}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-slate-900">
            {pro.companyName}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
          <span className="font-mono">
            {pro.vatNumber ?? "TVA non renseignée"}
          </span>
          <span>· {pro.email}</span>
          <span>
            · {pro.postalCode} {pro.city}
            {pro.interventionRadiusKm === -1
              ? " (Belgique)"
              : ` (${pro.interventionRadiusKm} km)`}
          </span>
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
          meta.bg,
          meta.text,
        )}
      >
        {meta.label}
      </span>

      <div className="hidden shrink-0 text-right sm:block">
        <div className="font-display text-[14px] font-bold text-slate-900">
          {formatPriceCents(pro.walletBalanceCents)}
        </div>
        <div className="text-[10.5px] uppercase tracking-wider text-slate-400">
          Wallet
        </div>
      </div>

      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400"
        aria-hidden
      >
        <Eye size={16} weight="regular" />
      </span>
    </Link>
  );
}

function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
