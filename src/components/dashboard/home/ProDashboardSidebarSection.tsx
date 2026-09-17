import { RightSidebarPanel } from "@/components/dashboard/home/RightSidebarPanel";
import { prisma } from "@/lib/prisma";

/**
 * Chargement async du panneau latéral du dashboard (auto-accept, rayon,
 * métiers), streamé sous `<Suspense>`.
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
