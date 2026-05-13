import type { Icon } from "@phosphor-icons/react";
import { Clock, FileText, Star, Users } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

// Stats — bande horizontale 4 stats sur fond navy.
// Section pleine largeur, contenu max-w-[1350px]. Tuiles internes
// bg-[#1e3a8a] : meme navy que ProCallout pour coherence visuelle
// (toutes les zones navy de la LP partagent #1e3a8a).
// Icones en orange chauffe #fb923c (orange-400) plutot que #ea580c pour
// eviter l'effet neon sur navy.
// TODO Sprint 2+ : remplacer par queries reelles (count des Pro/Leads).

const STATS: ReadonlyArray<{
  value: string;
  label: string;
  Icon: Icon;
}> = [
  { value: "32", label: "Artisans vérifiés", Icon: Users },
  { value: "127", label: "Demandes ce mois", Icon: FileText },
  { value: "4,7/5", label: "Note moyenne", Icon: Star },
  { value: "4h", label: "Délai moyen de réponse", Icon: Clock },
];

export function Stats() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1350px] px-6 py-10 lg:py-8">
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-[#1e3a8a] lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "group flex cursor-default items-center gap-4 px-5 py-5 transition-colors duration-200 hover:bg-[#2748a8] lg:py-4",
                i > 0 && "border-white/10 lg:border-l",
                i === 1 && "border-l",
                i >= 2 && "border-t lg:border-t-0",
              )}
            >
              <s.Icon
                size={28}
                weight="regular"
                className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ color: "#fb923c" }}
                aria-hidden
              />
              <div className="flex flex-col">
                <div className="font-display text-[22px] font-bold leading-none tracking-tight text-white transition-transform duration-200 group-hover:scale-105 lg:text-[22px]">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[11px] uppercase tracking-wide text-slate-300">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
