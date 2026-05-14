import { Suspense } from "react";

import { ProDashboardActivitySection } from "@/components/dashboard/home/ProDashboardActivitySection";
import { ProDashboardAvailableLeadsSection } from "@/components/dashboard/home/ProDashboardAvailableLeadsSection";
import { ProDashboardSidebarSection } from "@/components/dashboard/home/ProDashboardSidebarSection";
import { ProDashboardStatsSection } from "@/components/dashboard/home/ProDashboardStatsSection";
import { TipsSection } from "@/components/dashboard/home/TipsSection";
import { ListSectionSkeleton } from "@/components/dashboard/skeletons/ListSectionSkeleton";
import { StatsStripSkeleton } from "@/components/dashboard/skeletons/StatsStripSkeleton";
import { requireProSession } from "@/lib/auth-guards";

// /dashboard (home pro) Server Component streame :
//   - StatsStrip (getDashboardStats) -> Suspense
//   - AvailableLeads (getAvailableLeads + count) -> Suspense
//   - Right sidebar (profile auto-accept/radius/cats) -> Suspense
//   - RecentActivity (getRecentActivity) -> Suspense
//   - TipsSection : statique, pas de fetch
//
// Le greeting "Bonjour {firstName}" est rendu par la TopBar du layout
// en mode "expanded" sur cette route (cf. dashboard/layout.tsx).

export default async function DashboardHomePage() {
  const { userId, proProfileId } = await requireProSession();

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <Suspense fallback={<StatsStripSkeleton />}>
        <ProDashboardStatsSection proProfileId={proProfileId} />
      </Suspense>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Suspense fallback={<ListSectionSkeleton title="Leads disponibles" />}>
          <ProDashboardAvailableLeadsSection proProfileId={proProfileId} />
        </Suspense>

        <Suspense fallback={<ListSectionSkeleton title="Mes paramètres" rows={3} />}>
          <ProDashboardSidebarSection proProfileId={proProfileId} />
        </Suspense>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<ListSectionSkeleton title="Activité récente" rows={6} />}>
          <ProDashboardActivitySection
            proProfileId={proProfileId}
            userId={userId}
          />
        </Suspense>
        <TipsSection />
      </div>
    </main>
  );
}
