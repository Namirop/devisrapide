import { RightSidebarPanel } from "@/components/dashboard/RightSidebarPanel";
import { prisma } from "@/lib/prisma";

/**
 * Wrapper async pour le RightSidebarPanel (auto-accept, radius, cats)
 * sur /dashboard home. Suspendable.
 */
export async function ProDashboardSidebarSection({
  proProfileId,
}: {
  proProfileId: string;
}) {
  const profile = await prisma.proProfile.findUnique({
    where: { id: proProfileId },
    select: {
      autoAccept: true,
      interventionRadiusKm: true,
      categories: {
        select: { category: { select: { id: true, name: true } } },
      },
    },
  });

  const proCategories = profile?.categories.map((c) => c.category) ?? [];

  return (
    <RightSidebarPanel
      autoAccept={profile?.autoAccept ?? false}
      currentRadiusKm={profile?.interventionRadiusKm ?? 30}
      categories={proCategories}
    />
  );
}
