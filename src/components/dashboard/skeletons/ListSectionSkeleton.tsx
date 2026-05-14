type Props = {
  title: string;
  rows?: number;
};

/**
 * Skeleton generique pour une section liste (Available leads, Recent
 * activity, etc.). Card + titre + N rows animees.
 */
export function ListSectionSkeleton({ title, rows = 4 }: Props) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white"
      aria-busy="true"
      aria-label={`Chargement : ${title}`}
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
        <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
      </header>
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
          </li>
        ))}
      </ul>
    </section>
  );
}
