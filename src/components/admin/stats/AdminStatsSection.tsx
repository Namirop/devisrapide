import { AdminStatsStrip } from "@/components/admin/stats/AdminStatsStrip";
import { formatPriceCents } from "@/lib/stats";
import { getAdminHomeStats } from "@/server/queries/admin-stats";

/**
 * Wrapper async qui fetch les stats admin et rend AdminStatsStrip.
 * Conçu pour être utilisé dans <Suspense fallback={<AdminStatsStripSkeleton />}>
 * depuis /admin home (streaming Server Component).
 */
export async function AdminStatsSection() {
  const stats = await getAdminHomeStats();

  return (
    <AdminStatsStrip
      stats={[
        {
          label: "CA encaissé (Stripe) ce mois",
          value: formatPriceCents(stats.caMonthCents),
          sub: "HT",
          delta: stats.caDelta,
        },
        {
          label: "Wallet global",
          value: formatPriceCents(stats.walletGlobalCents),
          sub: "crédits dormants",
        },
        {
          label: "Demandes entrantes ce mois",
          value: String(stats.leadsMonthCount),
          sub: "leads créés",
          delta: stats.leadsDelta,
        },
        {
          label: "Leads non achetés (> 2h)",
          value: String(stats.souffranceLeadsCount),
          sub: stats.souffranceLeadsCount > 0 ? "à traiter" : "tout est OK",
          urgent: stats.souffranceLeadsCount > 0,
        },
      ]}
    />
  );
}
