/**
 * Skeleton fallback pour StatsStrip / AdminStatsStrip pendant Suspense.
 * 4 blocs grises animes (pulse). Generic, reutilisable cote pro et admin.
 */
export function StatsStripSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-1 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Chargement des statistiques"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 p-4">
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
