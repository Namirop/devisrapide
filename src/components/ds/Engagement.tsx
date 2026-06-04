import type { Icon } from "@phosphor-icons/react";
import {
  Clock,
  MagnifyingGlass,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

import { BEFlag } from "./BEFlag";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

// "Notre engagement" — remplace l'ancienne section Témoignages (pas d'avis
// réels en V1). 3 valeurs dans une carte blanche, séparateurs verticaux façon
// "tableau" (cohérent avec Stats/Categories). Drapeau belge = BEFlag maison
// (pas d'emoji), icônes Phosphor en pastille orange.

type Value = {
  title: string;
  text: string;
} & ({ flag: true } | { Icon: Icon });

const VALUES: ReadonlyArray<Value> = [
  {
    flag: true,
    title: "Plateforme belge",
    text: "Pensée et gérée en Belgique pour faciliter la mise en relation entre particuliers et professionnels en Wallonie et à Bruxelles.",
  },
  {
    Icon: Clock,
    title: "Un gain de temps réel",
    text: "Décrivez votre projet une seule fois. Les professionnels intéressés peuvent ensuite vous contacter.",
  },
  {
    Icon: MagnifyingGlass,
    title: "Transparence",
    text: "Service gratuit pour les particuliers. Vérification BCE/TVA des professionnels avant activation de leur compte.",
  },
];

export function Engagement() {
  return (
    <section id="engagement" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-12 lg:pb-14 lg:pt-16">
        <Reveal>
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#ea580c]">
                  <ShieldCheck
                    size={24}
                    weight="fill"
                    className="text-white"
                    aria-hidden
                  />
                </span>
                <h2 className="font-display text-[28px] font-bold tracking-tight lg:text-[34px]">
                  <span className="text-slate-900">Notre </span>
                  <span style={{ color: "#ea580c" }}>engagement</span>
                </h2>
              </div>
              <p className="mt-3 text-[14px] text-slate-500">
                Des valeurs simples pour une expérience fiable et sereine.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:mt-10 sm:grid-cols-3">
              {VALUES.map((v, i) => (
                <div
                  key={v.title}
                  className={cn(
                    "flex flex-col items-center px-2 py-7 text-center sm:px-7 sm:py-0",
                    i > 0 &&
                      "border-t border-slate-200 sm:border-l sm:border-t-0",
                  )}
                >
                  <span className="flex h-12 items-center justify-center">
                    {"Icon" in v ? (
                      <v.Icon
                        size={42}
                        weight="regular"
                        style={{ color: "#ea580c" }}
                        aria-hidden
                      />
                    ) : (
                      <BEFlag className="h-8 w-12 rounded-[2px]" />
                    )}
                  </span>
                  <h3 className="font-display mt-4 text-[17px] font-bold text-slate-900">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
