import { AvailableLeadsSection } from "@/components/dashboard/AvailableLeadsSection";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RightSidebarPanel } from "@/components/dashboard/RightSidebarPanel";
import { StatsStrip } from "@/components/dashboard/StatsStrip";
import { TipsSection } from "@/components/dashboard/TipsSection";
import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";
import {
  countAvailableLeads,
  getAvailableLeads,
} from "@/server/queries/available-leads";
import { getDashboardStats } from "@/server/queries/dashboard-stats";
import { getRecentActivity } from "@/server/queries/recent-activity";

export default async function DashboardHomePage() {
  const { userId, proProfileId } = await requireProSession();

  const [user, profile, stats, availableLeads, availableTotal, activity] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true },
      }),
      prisma.proProfile.findUnique({
        where: { id: proProfileId },
        select: {
          autoAccept: true,
          interventionRadiusKm: true,
          categories: {
            select: { category: { select: { id: true, name: true } } },
          },
        },
      }),
      getDashboardStats(proProfileId),
      getAvailableLeads({ proProfileId, limit: 5 }),
      countAvailableLeads(proProfileId),
      getRecentActivity({ proProfileId, userId, limit: 10 }),
    ]);

  const firstName = user?.firstName?.trim() || "";
  const creditsCount = Math.floor(stats.walletBalanceCents / 100);
  const proCategories = profile?.categories.map((c) => c.category) ?? [];

  return (
    <>
      {/* Bandeau greeting flush sous la TopBar. La TopBar vit hors du
          scroll container du layout — ici on est dedans, donc sticky top-0
          colle le bandeau au sommet de la zone scrollable (= juste sous la
          TopBar). Visuellement la TopBar parait s'agrandir sur la home.
          Specifique au dashboard index, les autres pages n'en ont pas besoin. */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-5 sm:px-8 sm:py-6">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-slate-900 lg:text-[30px]">
          Bonjour{firstName ? ` ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-[14px] text-slate-600">
          Voici un aperçu de votre activité aujourd&apos;hui.
        </p>
      </div>

      <main className="px-4 py-6 sm:px-8 sm:py-8">
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

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <AvailableLeadsSection
            leads={availableLeads}
            totalCount={availableTotal}
          />

          <RightSidebarPanel
            autoAccept={profile?.autoAccept ?? false}
            currentRadiusKm={profile?.interventionRadiusKm ?? 30}
            categories={proCategories}
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <RecentActivity items={activity} />
          <TipsSection />
        </div>
      </main>
    </>
  );
}
