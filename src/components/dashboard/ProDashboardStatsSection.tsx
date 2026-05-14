import { StatsStrip } from "@/components/dashboard/StatsStrip";
import { formatPriceCents } from "@/lib/stats";
import { getDashboardStats } from "@/server/queries/dashboard-stats";

/**
 * Wrapper async pour la StatsStrip du dashboard pro home.
 * Suspendable via <Suspense fallback={<StatsStripSkeleton />}>.
 */
export async function ProDashboardStatsSection({
  proProfileId,
}: {
  proProfileId: string;
}) {
  const stats = await getDashboardStats(proProfileId);
  const creditsCount = Math.floor(stats.walletBalanceCents / 100);

  return (
    <StatsStrip
      stats={[
        {
          label: "Crédits disponibles",
          value: formatPriceCents(stats.walletBalanceCents),
          sub: `${creditsCount} crédit${creditsCount > 1 ? "s" : ""}`,
        },
        {
          label: "Leads achetés",
          value: String(stats.accepted.current),
          sub: "ce mois-ci",
          delta: stats.accepted.delta,
        },
        {
          label: "Leads convertis",
          value: String(stats.converted.current),
          sub:
            stats.accepted.current > 0
              ? `${stats.conversionRate}% conv.`
              : "ce mois-ci",
          delta: stats.converted.delta,
        },
        {
          label: "Dépensé ce mois-ci",
          value: formatPriceCents(stats.spentCents.current),
          sub: "HT",
          delta: stats.spentCents.delta,
        },
      ]}
    />
  );
}
