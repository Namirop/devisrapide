import { AvailableLeadsSection } from "@/components/dashboard/leads/AvailableLeadsSection";
import {
  countAvailableLeads,
  getAvailableLeads,
} from "@/server/queries/available-leads";

/**
 * Wrapper async pour la section "Leads disponibles" sur /dashboard home.
 * Suspendable via <Suspense fallback={<ListSectionSkeleton />}>.
 */
export async function ProDashboardAvailableLeadsSection({
  proProfileId,
}: {
  proProfileId: string;
}) {
  const [leads, totalCount] = await Promise.all([
    getAvailableLeads({ proProfileId, limit: 5 }),
    countAvailableLeads(proProfileId),
  ]);

  return <AvailableLeadsSection leads={leads} totalCount={totalCount} />;
}
