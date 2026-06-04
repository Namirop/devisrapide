import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { CATEGORIES } from "@/lib/categories";

// Categories — grille 9 items effet "tableau".
// Pas de cards individuelles. Separateurs internes 1px via gap + fond
// slate-200 (chaque cellule bg-white). SOS = rouge + pill "24/7".

export function Categories() {
  return (
    <section id="categories" className="relative scroll-mt-20 lg:scroll-mt-16">
      <div className="mx-auto max-w-[1400px] px-6 pb-12 pt-12 lg:pb-10 lg:pt-13">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-slate-900 lg:text-[32px]">
            Nos catégories les plus{" "}
            <span style={{ color: "#ea580c" }}>populaires</span>
          </h2>
          <Link
            href="/demande"
            className="hidden items-center gap-1.5 text-[13px] font-medium text-[#1e3a8a] hover:underline sm:inline-flex"
          >
            Voir tous les métiers
            <ArrowRight size={14} weight="bold" aria-hidden />
          </Link>
        </div>

        {/* Grille tableau : bordures internes via gap + fond slate-200 */}
        <div
          className="grid grid-cols-3 border border-slate-200 sm:grid-cols-5 lg:grid-cols-9"
          style={{ backgroundColor: "#e2e8f0", gap: "1px" }}
        >
          {CATEGORIES.map((c) => {
            const href = `/demande?universe=${c.universeSlug}`;
            return (
              <Link
                key={c.id}
                href={href}
                className="group relative flex min-h-[132px] flex-col items-center justify-center gap-2.5 bg-white px-3 py-5 text-center transition-transform duration-200 hover:z-10 hover:scale-[1.05] hover:shadow-lg"
              >
                {c.urgent && (
                  <span
                    className="absolute right-2 top-2 inline-flex items-center rounded-sm px-1.5 py-px text-[9.5px] font-bold tracking-wide text-white"
                    style={{ backgroundColor: "#dc2626" }}
                  >
                    24/7
                  </span>
                )}
                <span className="flex h-12 items-center justify-center">
                  <Image
                    src={c.iconSrc}
                    alt=""
                    width={120}
                    height={48}
                    unoptimized
                    className="h-12 w-auto object-contain"
                  />
                </span>
                <div className="text-[12px] font-semibold leading-tight text-slate-900">
                  {c.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/demande"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1e3a8a] hover:underline"
          >
            Voir tous les métiers
            <ArrowRight size={14} weight="bold" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
