// Loading state route-level pour /dashboard et toutes ses sous-routes.
// V1 simple : skeleton statique. Suspense par section (streaming) est
// note dans v2-roadmap si justifie par les TTI metric en prod.

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="h-8 w-64 animate-pulse rounded-md bg-slate-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    </main>
  );
}
