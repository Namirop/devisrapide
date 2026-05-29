import { Suspense } from "react";

import { LeadsListSection } from "@/components/dashboard/leads/LeadsListSection";
import { ListSectionSkeleton } from "@/components/dashboard/skeletons/ListSectionSkeleton";
import { requireProSession } from "@/lib/auth-guards";

type SearchParams = Promise<{ page?: string }>;

export default async function LeadsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { proProfileId } = await requireProSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <header className="mb-5 sm:mb-6">
        <h1 className="font-display text-[24px] font-bold tracking-tight text-slate-900 sm:text-[28px] lg:text-[34px]">
          Leads disponibles
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-600 sm:text-[14.5px]">
          Les demandes qui matchent votre profil apparaissent ici.
        </p>
      </header>

      <Suspense
        fallback={<ListSectionSkeleton title="Leads disponibles" rows={8} />}
      >
        <LeadsListSection proProfileId={proProfileId} page={page} />
      </Suspense>
    </main>
  );
}
