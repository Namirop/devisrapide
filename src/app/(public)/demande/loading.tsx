// Skeleton instantane affiche pendant le RSC fetch de /demande (Prisma +
// react render). Calque visuellement la structure du wizard (progress bar
// 6 etapes + card centrale + nav buttons) pour eviter le flash blanc
// et donner un feedback immediat a la navigation.

export default function DemandeLoading() {
  return (
    <div className="relative flex flex-1 flex-col bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-fixed"
        aria-hidden
      />
      <section className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 lg:py-10">
        <div className="relative flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-2">
          <header className="sticky top-[76px] z-30 flex flex-col gap-3 bg-white py-2">
            <div
              className="flex flex-1 gap-2"
              role="progressbar"
              aria-busy="true"
              aria-label="Chargement du formulaire"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="flex h-6 items-center justify-center text-[13px] text-slate-300">
                    {i + 1}
                  </span>
                  <div className="h-1 w-full rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 px-1 py-8">
            <div className="h-7 w-2/3 animate-pulse rounded-md bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-slate-100" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[80px] animate-pulse rounded-md border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-slate-100 py-4">
            <div className="h-10 w-24 animate-pulse rounded-md bg-slate-100" />
            <div className="h-10 w-32 animate-pulse rounded-md bg-slate-200" />
          </div>
        </div>
      </section>
    </div>
  );
}
