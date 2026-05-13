import { CheckCircle2, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

import { AutoAcceptWidget } from "@/components/dashboard/AutoAcceptWidget";
import { AvailableLeadsSection } from "@/components/dashboard/AvailableLeadsSection";
import { CategoriesWidget } from "@/components/dashboard/CategoriesWidget";
import { InterventionZoneWidget } from "@/components/dashboard/InterventionZoneWidget";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatCard } from "@/components/dashboard/StatCard";
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

  const [
    user,
    profile,
    stats,
    availableLeads,
    availableTotal,
    activity,
  ] = await Promise.all([
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
          select: {
            category: { select: { id: true, name: true } },
          },
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
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 lg:text-[30px]">
          Bonjour{firstName ? ` ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          Voici un aperçu de votre activité aujourd&apos;hui.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Crédits disponibles"
          value={formatPriceCents(stats.walletBalanceCents)}
          sub={`${creditsCount} crédit${creditsCount > 1 ? "s" : ""}`}
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-[#1e3a8a]"
        />
        <StatCard
          label="Leads achetés"
          value={String(stats.accepted.current)}
          sub="Ce mois-ci"
          delta={stats.accepted.delta}
          icon={ShoppingCart}
          iconBg="bg-orange-50"
          iconColor="text-[#ea580c]"
        />
        <StatCard
          label="Leads convertis"
          value={String(stats.converted.current)}
          sub={
            stats.accepted.current > 0
              ? `${stats.conversionRate}% de conversion`
              : "Ce mois-ci"
          }
          delta={stats.converted.delta}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Dépensé ce mois-ci"
          value={formatPriceCents(stats.spentCents.current)}
          sub="HT"
          delta={stats.spentCents.delta}
          icon={TrendingUp}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <AvailableLeadsSection
          leads={availableLeads}
          totalCount={availableTotal}
        />

        <aside className="flex flex-col gap-4">
          <AutoAcceptWidget initialValue={profile?.autoAccept ?? false} />
          <InterventionZoneWidget
            currentRadiusKm={profile?.interventionRadiusKm ?? 30}
          />
          <CategoriesWidget categories={proCategories} />
          <QuickActionsWidget />
        </aside>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity items={activity} />
        <TipsSection />
      </div>
    </main>
  );
}
