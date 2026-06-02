import type { Icon } from "@phosphor-icons/react";
import {
  FileText,
  HardHat,
  Lightning,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

// Bandeau de réassurance — barre horizontale navy, 4 garanties qualitatives.
// Pas de chiffres en V1 (volumes encore petits) : on met en avant des
// garanties (vérification BCE/TVA, gratuité, rapidité) plutôt que des
// compteurs. Même base visuelle que ProCallout (#1e3a8a, icônes orange).

const TILES: ReadonlyArray<{ title: string; sub: string; Icon: Icon }> = [
  { title: "Professionnels", sub: "Vérifiés (BCE / TVA)", Icon: HardHat },
  { title: "Demandes", sub: "Locales & qualifiées", Icon: FileText },
  { title: "Service", sub: "Gratuit & sans engagement", Icon: ShieldCheck },
  { title: "Mise en relation", sub: "Rapide & simplifiée", Icon: Lightning },
];

export function Stats() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1350px] px-6 pb-10 pt-5 lg:pb-8 lg:pt-4">
        <Reveal>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-[#1e3a8a] lg:grid-cols-4">
            {TILES.map((s, i) => (
              <div
                key={s.title}
                className={cn(
                  "group flex cursor-default flex-col items-center gap-2.5 px-3 py-6 text-center transition-colors duration-200 hover:bg-[#2748a8] sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:text-left lg:py-4",
                  i > 0 && "border-white/10 lg:border-l",
                  i % 2 === 1 && "border-l",
                  i >= 2 && "border-t lg:border-t-0",
                )}
              >
                <s.Icon
                  size={30}
                  weight="regular"
                  className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: "#fb923c" }}
                  aria-hidden
                />
                <div className="flex flex-col">
                  <div className="font-display text-[15px] font-bold leading-tight tracking-tight text-white sm:text-[17px]">
                    {s.title}
                  </div>
                  <div className="mt-1 text-[10.5px] uppercase tracking-wide text-slate-300 sm:text-[11px]">
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
