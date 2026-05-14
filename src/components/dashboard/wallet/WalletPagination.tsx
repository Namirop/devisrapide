import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

type Props = {
  page: number;
  totalPages: number;
};

/**
 * Pagination dediee /dashboard/wallet (preserve la query `?page=` cote
 * URL pour pagination server-side via le Server Component parent).
 */
export function WalletPagination({ page, totalPages }: Props) {
  const prevHref = page > 1 ? `/dashboard/wallet?page=${page - 1}` : null;
  const nextHref =
    page < totalPages ? `/dashboard/wallet?page=${page + 1}` : null;

  return (
    <nav className="mt-4 flex items-center justify-center gap-2">
      <PageButton href={prevHref} aria="Page précédente">
        <CaretLeft size={14} weight="bold" />
      </PageButton>
      <span className="text-[13px] text-slate-600">
        Page {page} / {totalPages}
      </span>
      <PageButton href={nextHref} aria="Page suivante">
        <CaretRight size={14} weight="bold" />
      </PageButton>
    </nav>
  );
}

function PageButton({
  href,
  aria,
  children,
}: {
  href: string | null;
  aria: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span
        aria-hidden
        className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 text-slate-300"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={aria}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}
