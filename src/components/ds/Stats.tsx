import type { Icon } from "@phosphor-icons/react";
import { Clock, FileText, Star, Users } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "./Reveal";
import { getLaunchStats } from "@/lib/launch-stats";
import { cn } from "@/lib/utils";

// Stats — bande horizontale 4 stats sur fond navy.
// Section pleine largeur, contenu max-w-[1350px]. Tuiles internes
// bg-[#1e3a8a] : meme navy que ProCallout pour coherence visuelle.
// Icones en orange chauffe #fb923c (orange-400).
//
// 2 stats reelles via getLaunchStats (count Prisma) :
//   - verifiedPros (ProProfile VALIDATED)
//   - monthlyLeads (Lead createdAt >= debut mois)
// 2 stats hardcoded au launch (V2 = vraies queries) :
//   - averageRating, averageDelayHours
// Voir src/lib/launch-stats.ts pour le detail.

export async function Stats() {
  const stats = await getLaunchStats();

  const tiles: ReadonlyArray<{ value: string; label: string; Icon: Icon }> = [
    {
      value: String(stats.verifiedPros),
      label: "Artisans vérifiés",
      Icon: Users,
    },
    {
      value: String(stats.monthlyLeads),
      label: "Demandes ce mois",
      Icon: FileText,
    },
    {
      value: `${stats.averageRating.toString().replace(".", ",")}/${stats.averageRatingMax}`,
      label: "Note moyenne",
      Icon: Star,
    },
    {
      value: `${stats.averageDelayHours}h`,
      label: "Délai moyen de réponse",
      Icon: Clock,
    },
  ];

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1350px] px-6 py-10 lg:py-8">
        <Reveal>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-[#1e3a8a] lg:grid-cols-4">
            {tiles.map((s, i) => (
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
        </Reveal>
      </div>
    </section>
  );
}
