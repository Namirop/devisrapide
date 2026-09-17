import { RecentActivity } from "@/components/dashboard/home/RecentActivity";
import { getRecentActivity } from "@/server/queries/recent-activity";

/** Activité récente du dashboard, chargée à part pour être streamée. */
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
