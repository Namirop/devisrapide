import { cn } from "@/lib/utils";

// Stats — bande horizontale unique, separateurs verticaux fins.
// Pas de cards ni d'icones. Gros chiffres navy, labels gris uppercase.
// TODO Sprint 2+ : remplacer par queries reelles (count des Pro/Leads).

const STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "32", label: "Artisans vérifiés" },
  { value: "127", label: "Demandes ce mois" },
  { value: "4,7/5", label: "Note moyenne" },
  { value: "4h", label: "Délai moyen de réponse" },
];

export function Stats() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 pb-12 pt-4">
        <div className="grid grid-cols-2 border-y border-slate-200 lg:grid-cols-4">
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
              <div
                className="text-[34px] font-bold leading-none tracking-tight lg:text-[40px]"
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
