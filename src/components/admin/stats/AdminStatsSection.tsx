import { AdminStatsStrip } from "@/components/admin/stats/AdminStatsStrip";
import { formatPriceCents } from "@/lib/stats";
import { getAdminHomeStats } from "@/server/queries/admin-stats";

/**
 * Chargement async des statistiques de l'accueil admin, streamées sous
 * `<Suspense>`.
 */
export async function AdminStatsSection() {
  const stats = await getAdminHomeStats();

  return (
    <AdminStatsStrip
      stats={[
        {
          label: "CA encaissé (Stripe) ce mois",
          value: formatPriceCents(stats.caMonthCents),
          sub: "TVAC, hors bonus offert",
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
          label: `Leads non achetés (> ${stats.souffranceHours}h)`,
          value: String(stats.souffranceLeadsCount),
          sub: stats.souffranceLeadsCount > 0 ? "à traiter" : "tout est OK",
          urgent: stats.souffranceLeadsCount > 0,
        },
      ]}
    />
  );
}
