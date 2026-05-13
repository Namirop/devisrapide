import { Users, FileText, Star, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Stats — bande horizontale 4 stats sur fond navy dark #0f1e3d.
// Section pleine largeur, contenu max-w-[1350px]. Tuiles internes opaque
// bg-[#1a2950] (variante plus claire que le fond, sobre — pas glass).
// Icones en orange chauffe #fb923c (orange-400) plutot que #ea580c pour
// eviter l'effet neon sur navy dark.
// TODO Sprint 2+ : remplacer par queries reelles (count des Pro/Leads).

const STATS: ReadonlyArray<{
  value: string;
  label: string;
  Icon: LucideIcon;
}> = [
  { value: "32", label: "Artisans vérifiés", Icon: Users },
  { value: "127", label: "Demandes ce mois", Icon: FileText },
  { value: "4,7/5", label: "Note moyenne", Icon: Star },
  { value: "4h", label: "Délai moyen de réponse", Icon: Clock },
];

export function Stats() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1350px] px-6 py-10 lg:py-6">
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-[#1a2950] lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-4 px-5 py-5 lg:py-4",
                i > 0 && "border-white/10 lg:border-l",
                i === 1 && "border-l",
                i >= 2 && "border-t lg:border-t-0",
              )}
            >
              <s.Icon
                className="h-[28px] w-[28px] shrink-0"
                strokeWidth={1.75}
                style={{ color: "#fb923c" }}
                aria-hidden
              />
              <div className="flex flex-col">
                <div className="font-display text-[22px] font-bold leading-none tracking-tight text-white lg:text-[22px]">
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
