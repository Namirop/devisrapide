type Props = {
  /** Titre du bloc (ex: "Pros en attente", "Leads en souffrance"). */
  title: string;
  /** Nombre de lignes a render dans le skeleton. */
  rows?: number;
};

/**
 * Skeleton generique pour les listes admin home (PendingProsList,
 * SouffranceLeadsList). Layout : card titre + N lignes grisees.
 */
export function AdminListSkeleton({ title, rows = 5 }: Props) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white"
      aria-busy="true"
      aria-label={`Chargement : ${title}`}
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
        <div className="h-4 w-8 animate-pulse rounded bg-slate-100" />
      </header>
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
            <div className="ml-auto h-3 w-12 animate-pulse rounded bg-slate-100" />
          </li>
        ))}
      </ul>
    </section>
  );
}
