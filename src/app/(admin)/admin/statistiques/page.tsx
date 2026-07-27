import { AdminStatsSection } from "@/components/admin/stats/AdminStatsSection";
import { requireAdminSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AdminStatsPage() {
  await requireAdminSession();

  // Pros count par status (reutilise getProsTabsCounts mais en inline
  // pour eviter de cross-import un fichier query d'une autre feature).
  const [proPending, proValidated, proSuspended, proRejected] =
    await Promise.all([
      prisma.proProfile.count({ where: { validationStatus: "PENDING" } }),
      prisma.proProfile.count({ where: { validationStatus: "VALIDATED" } }),
      prisma.proProfile.count({ where: { validationStatus: "SUSPENDED" } }),
      prisma.proProfile.count({ where: { validationStatus: "REJECTED" } }),
    ]);

  // Top 5 categories par count de leads (toutes periodes).
  const topCategoriesRaw = await prisma.lead.groupBy({
    by: ["subCategoryId"],
    where: { deletedAt: null },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  const topSubCategoryDetails = await prisma.subCategory.findMany({
    where: { id: { in: topCategoriesRaw.map((c) => c.subCategoryId) } },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
    },
  });
  const topCategories = topCategoriesRaw
    .map((c) => {
      const sc = topSubCategoryDetails.find((s) => s.id === c.subCategoryId);
      return {
        subCategoryId: c.subCategoryId,
        categoryName: sc?.category.name ?? "—",
        subCategoryName: sc?.name ?? "—",
        count: c._count.id,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Top 5 villes par count de leads.
  const topCitiesRaw = await prisma.lead.groupBy({
    by: ["city"],
    where: { deletedAt: null },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  const topCities = topCitiesRaw.map((c) => ({
    city: c.city,
    count: c._count.id,
  }));

  // Taux d'acceptation = count assignments ACCEPTED / count total assignments.
  // V1 simple : taux global toutes periodes.
  const [acceptedCount, totalAssignments] = await Promise.all([
    prisma.leadAssignment.count({ where: { status: "ACCEPTED" } }),
    prisma.leadAssignment.count(),
  ]);
  const acceptanceRate =
    totalAssignments > 0
      ? Math.round((acceptedCount / totalAssignments) * 100)
      : 0;

  const proTotal = proPending + proValidated + proSuspended + proRejected;

  return (
    <main className="px-5 pt-4 pb-6 sm:px-10 sm:pt-5 sm:pb-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[34px]">
          Statistiques
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-600">
          Vue d&apos;ensemble de l&apos;activité plateforme. V1 : chiffres
          bruts, pas de graphes — les charts arriveront en V2 si besoin.
        </p>
      </header>

      {/* Meme bandeau que la home admin : une seule source pour les 4
          metriques, sinon les deux pages finissent par diverger. */}
      <AdminStatsSection />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pros breakdown */}
        <Block title="Professionnels par statut">
          <div className="grid grid-cols-2 gap-4">
            <StatLine label="En attente" value={proPending} total={proTotal} />
            <StatLine label="Validés" value={proValidated} total={proTotal} />
            <StatLine label="Suspendus" value={proSuspended} total={proTotal} />
            <StatLine label="Refusés" value={proRejected} total={proTotal} />
          </div>
          <p className="mt-4 text-[12px] text-slate-500">
            Total : {proTotal} pro{proTotal > 1 ? "s" : ""} inscrits sur la
            plateforme.
          </p>
        </Block>

        {/* Acceptance rate */}
        <Block title="Taux d'acceptation des leads">
          <div className="font-display text-[56px] font-bold leading-none tracking-tight text-slate-900">
            {acceptanceRate}%
          </div>
          <p className="mt-3 text-[13px] text-slate-600">
            <span className="font-semibold text-emerald-600">
              {acceptedCount}
            </span>{" "}
            assignment{acceptedCount > 1 ? "s" : ""} accepté
            {acceptedCount > 1 ? "s" : ""} sur{" "}
            <span className="font-semibold">{totalAssignments}</span> envoyé
            {totalAssignments > 1 ? "s" : ""} au total.
          </p>
        </Block>

        {/* Top categories */}
        <Block title="Top 5 catégories par demandes">
          {topCategories.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Aucune donnée pour le moment.
            </p>
          ) : (
            <table className="w-full text-[13.5px]">
              <tbody>
                {topCategories.map((c) => (
                  <tr
                    key={c.subCategoryId}
                    className="border-t border-slate-100 first:border-0"
                  >
                    <td className="py-2 text-slate-700">
                      <div className="font-medium text-slate-900">
                        {c.categoryName}
                      </div>
                      <div className="text-[12px] text-slate-500">
                        {c.subCategoryName}
                      </div>
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {c.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Block>

        {/* Top cities */}
        <Block title="Top 5 villes par demandes">
          {topCities.length === 0 ? (
            <p className="text-[13px] text-slate-500">
              Aucune donnée pour le moment.
            </p>
          ) : (
            <table className="w-full text-[13.5px]">
              <tbody>
                {topCities.map((c) => (
                  <tr
                    key={c.city}
                    className="border-t border-slate-100 first:border-0"
                  >
                    <td className="py-2 font-medium text-slate-900">
                      {c.city}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {c.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Block>
      </div>
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <h2 className="font-display mb-4 text-[16px] font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatLine({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[24px] font-bold text-slate-900">
          {value}
        </span>
        <span
          className={cn(
            "text-[12px] font-medium",
            value > 0 ? "text-slate-500" : "text-slate-400",
          )}
        >
          ({pct}%)
        </span>
      </div>
    </div>
  );
}
