import { AvailableLeadsSection } from "@/components/dashboard/leads/AvailableLeadsSection";
import {
  countAvailableLeads,
  getAvailableLeads,
} from "@/server/queries/available-leads";

/** Leads disponibles du dashboard, chargés à part pour être streamés. */
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
