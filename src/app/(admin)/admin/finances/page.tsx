import type { Metadata } from "next";

import { requireAdminSession } from "@/lib/auth-guards";
import { formatPriceCents } from "@/lib/stats";
import {
  getProRechargesForPeriod,
  listProsForSelect,
} from "@/server/queries/admin-recharges";

export const metadata: Metadata = {
  title: "Finances — Récap recharges — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ pro?: string; debut?: string; fin?: string }>;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function toYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default async function AdminFinancesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminSession();
  const sp = await searchParams;

  const pros = await listProsForSelect();
  const selectedPro =
    sp.pro && pros.some((p) => p.id === sp.pro) ? sp.pro : "";

  // Défauts : mois courant. Le serveur tourne en UTC (Vercel).
  const now = new Date();
  const defaultDebut = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}-01`;
  const defaultFin = toYmd(now);

  const debut = sp.debut && YMD_RE.test(sp.debut) ? sp.debut : defaultDebut;
  const fin = sp.fin && YMD_RE.test(sp.fin) ? sp.fin : defaultFin;

  const start = new Date(`${debut}T00:00:00.000Z`);
  const endExclusive = new Date(`${fin}T00:00:00.000Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  const result = selectedPro
    ? await getProRechargesForPeriod({
        proProfileId: selectedPro,
        start,
        endExclusive,
      })
    : null;

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Finances — Récap recharges
        </h1>
        <p className="mt-1 max-w-2xl text-[14.5px] text-slate-600">
          Recharges d&apos;un artisan sur une période, pour établir les
          factures B2B mensuelles. Le total porte sur le montant{" "}
          <strong className="font-semibold">payé</strong> (hors bonus offert).
        </p>
      </header>

      {/* Filtres en GET : URL partageable, pas de JS client. */}
      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] font-medium text-slate-500">
            Artisan
          </span>
          <select
            name="pro"
            defaultValue={selectedPro}
            className="h-9 min-w-[220px] rounded-md border border-slate-200 bg-white px-2.5 text-[13.5px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          >
            <option value="">— Sélectionner —</option>
            {pros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.companyName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] font-medium text-slate-500">Du</span>
          <input
            type="date"
            name="debut"
            defaultValue={debut}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-[13.5px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] font-medium text-slate-500">Au</span>
          <input
            type="date"
            name="fin"
            defaultValue={fin}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-[13.5px] text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </label>

        <button
          type="submit"
          className="h-9 rounded-lg bg-[#1e3a8a] px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#1e3a8a]/90"
        >
          Afficher
        </button>
      </form>

      {!selectedPro ? (
        <p className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center text-[13.5px] text-slate-500">
          Sélectionnez un artisan et une période, puis cliquez sur «&nbsp;Afficher&nbsp;».
        </p>
      ) : !result || result.rows.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center text-[13.5px] text-slate-500">
          Aucune recharge sur cette période.
        </p>
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <Th>Date</Th>
                  <Th align="right">Payé</Th>
                  <Th align="right">Bonus</Th>
                  <Th align="right">Crédité</Th>
                  <Th>Statut</Th>
                  <Th>Réf. Stripe</Th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-700">
                      {r.createdAt.toLocaleDateString("fr-BE", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                      {r.amountPaidCents === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        formatPriceCents(r.amountPaidCents)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                      {r.bonusCents === null ? (
                        <span className="text-slate-400">—</span>
                      ) : r.bonusCents === 0 ? (
                        "—"
                      ) : (
                        `+${formatPriceCents(r.bonusCents)}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                      {formatPriceCents(r.amountCreditedCents)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700">
                        Réussi
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {r.stripePaymentIntentId ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                    Total payé sur la période
                  </td>
                  <td className="font-display px-4 py-3 text-right text-[15px] font-bold text-slate-900 tabular-nums">
                    {formatPriceCents(result.totalPaidCents)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>

          {result.hasMissingPaid && (
            <p className="border-t border-slate-100 px-4 py-2.5 text-[11.5px] text-slate-500">
              Certaines recharges antérieures n&apos;ont pas le détail payé /
              bonus (affiché «&nbsp;—&nbsp;») et sont exclues du total payé.
            </p>
          )}
        </section>
      )}
    </main>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
