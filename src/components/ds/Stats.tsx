import { Users, FileText, Star, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Stats — bande horizontale 4 stats. Ancrage discret bg-slate-50 + border
// rounded-lg pour ne pas flotter sur du blanc pur. Icone lucide navy au-dessus
// du chiffre comme repere visuel.
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
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 pb-12 pt-4">
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "flex flex-col items-start px-6 py-7 lg:py-8",
                i > 0 && "border-slate-200 lg:border-l",
                i === 1 && "border-l",
                i >= 2 && "border-t lg:border-t-0",
              )}
            >
              <s.Icon
                className="h-[22px] w-[22px] text-[#1e3a8a]"
                strokeWidth={1.75}
                aria-hidden
              />
              <div
                className="mt-3 text-[34px] font-bold leading-none tracking-tight lg:text-[40px]"
                style={{ color: "#1e3a8a" }}
              >
                {s.value}
              </div>
              <div className="mt-3 text-[12.5px] uppercase tracking-wide text-slate-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
