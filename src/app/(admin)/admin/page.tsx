import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Gift, SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";

import { AdminPendingProsSection } from "@/components/admin/pros/AdminPendingProsSection";
import { AdminSouffranceLeadsSection } from "@/components/admin/leads/AdminSouffranceLeadsSection";
import { AdminStatsSection } from "@/components/admin/stats/AdminStatsSection";
import { AdminListSkeleton } from "@/components/admin/skeletons/AdminListSkeleton";
import { AdminStatsStripSkeleton } from "@/components/admin/skeletons/AdminStatsStripSkeleton";
import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// /admin (home) Server Component streame :
//   - Header (firstName) rendu inline (1 query rapide)
//   - AdminStatsSection -> getAdminHomeStats() suspendu
//   - SouffranceLeadsSection -> lead findMany suspendu
//   - PendingProsSection -> pro findMany + count suspendu
//
// Sprint 5b : passage de Promise.all bloquant a streaming Suspense
// pour ramener le shell de page instantanement (TTFB ameliore visible
// sur cold Neon).

export default async function AdminHomePage() {
  const { userId } = await requireAdminSession();
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true },
  });
  const firstName = admin?.firstName?.trim() || "admin";

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

      <Suspense fallback={<AdminStatsStripSkeleton />}>
        <AdminStatsSection />
      </Suspense>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<AdminListSkeleton title="Leads en souffrance" />}>
          <AdminSouffranceLeadsSection />
        </Suspense>
        <Suspense fallback={<AdminListSkeleton title="Pros en attente" />}>
          <AdminPendingProsSection />
        </Suspense>
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
