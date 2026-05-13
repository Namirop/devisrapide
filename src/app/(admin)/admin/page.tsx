import Link from "next/link";
import { ArrowRight, Gift, SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";

import { AdminStatsStrip } from "@/components/admin/AdminStatsStrip";
import {
  PendingProsList,
  type PendingProRow,
} from "@/components/admin/PendingProsList";
import {
  SouffranceLeadsList,
  type SouffranceLeadRow,
} from "@/components/admin/SouffranceLeadsList";
import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatPriceCents } from "@/lib/stats";
import { getAdminHomeStats } from "@/server/queries/admin-stats";

export default async function AdminHomePage() {
  const { userId } = await requireAdminSession();

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [admin, stats, souffranceLeadsRaw, pendingProsRaw, pendingProsCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true },
      }),
      getAdminHomeStats(),
      // Top 5 leads en souffrance (matchingStartedAt < 2h ago, no ACCEPTED)
      prisma.lead.findMany({
        where: {
          status: { in: ["PENDING_MATCH", "ASSIGNED"] },
          matchingStartedAt: { lt: twoHoursAgo },
          deletedAt: null,
          assignments: { none: { status: "ACCEPTED" } },
        },
        orderBy: { matchingStartedAt: "asc" },
        take: 5,
        select: {
          id: true,
          city: true,
          postalCode: true,
          matchingStartedAt: true,
          sharedLeadPriceCentsSnapshot: true,
          subCategory: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      // Top 5 pros PENDING tries par anciennete (les plus anciens d'abord)
      prisma.proProfile.findMany({
        where: { validationStatus: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: {
          id: true,
          companyName: true,
          vatNumber: true,
          createdAt: true,
        },
      }),
      prisma.proProfile.count({ where: { validationStatus: "PENDING" } }),
    ]);

  const firstName = admin?.firstName?.trim() || "admin";

  const souffranceLeads: SouffranceLeadRow[] = souffranceLeadsRaw.map((l) => ({
    id: l.id,
    categoryName: l.subCategory.category.name,
    subCategoryName: l.subCategory.name,
    city: l.city,
    postalCode: l.postalCode,
    priceCents: l.sharedLeadPriceCentsSnapshot,
    matchingStartedAt: l.matchingStartedAt,
  }));

  const pendingPros: PendingProRow[] = pendingProsRaw.map((p) => ({
    proProfileId: p.id,
    companyName: p.companyName,
    vatNumber: p.vatNumber,
    createdAt: p.createdAt,
  }));

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Bonjour {firstName}
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          Voici l&apos;activité de DevisRapide en temps réel.
        </p>
      </header>

      <AdminStatsStrip
        stats={[
          {
            label: "CA encaissé (Stripe) ce mois",
            value: formatPriceCents(stats.caMonthCents),
            sub: "HT",
            delta: stats.caDelta,
          },
          {
            label: "Wallet global",
            value: formatPriceCents(stats.walletGlobalCents),
            sub: "crédits dormants",
          },
          {
            label: "Demandes entrantes ce mois",
            value: String(stats.leadsMonthCount),
            sub: "leads créés",
            delta: stats.leadsDelta,
          },
          {
            label: "Leads non achetés (> 2h)",
            value: String(stats.souffranceLeadsCount),
            sub: stats.souffranceLeadsCount > 0 ? "à traiter" : "tout est OK",
            urgent: stats.souffranceLeadsCount > 0,
          },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SouffranceLeadsList
          leads={souffranceLeads}
          totalCount={stats.souffranceLeadsCount}
        />
        <PendingProsList pros={pendingPros} totalCount={pendingProsCount} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuickActionCard
          href="/admin/leads"
          icon={
            <Gift
              size={20}
              weight="regular"
              className="text-[#ea580c]"
              aria-hidden
            />
          }
          title="Offrir un lead à un pro"
          description="Sélectionnez un lead disponible et attribuez-le gratuitement à un pro validé."
        />
        <QuickActionCard
          href="/admin/professionnels"
          icon={
            <SlidersHorizontal
              size={20}
              weight="regular"
              className="text-[#1e3a8a]"
              aria-hidden
            />
          }
          title="Ajuster un solde"
          description="Créditez ou débitez manuellement le wallet d&apos;un pro avec une raison."
        />
      </div>
    </main>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-slate-900">
            {title}
          </span>
          <ArrowRight
            size={14}
            weight="bold"
            className="text-slate-400 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </Link>
  );
}
