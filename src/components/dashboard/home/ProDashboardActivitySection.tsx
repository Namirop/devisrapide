import { RecentActivity } from "@/components/dashboard/home/RecentActivity";
import { getRecentActivity } from "@/server/queries/recent-activity";

/**
 * Wrapper async pour la section "Activité récente" sur /dashboard home.
 * Suspendable via <Suspense fallback={<ListSectionSkeleton />}>.
 */
export async function ProDashboardActivitySection({
  proProfileId,
  userId,
}: {
  proProfileId: string;
  userId: string;
}) {
  const activity = await getRecentActivity({ proProfileId, userId, limit: 10 });
  return <RecentActivity items={activity} />;
}
