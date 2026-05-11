// Stats — bande horizontale unique, séparateurs verticaux fins, pas de cards ni d'icônes.
// Gros chiffres navy, labels gris dessous.

const STATS = [
  { value: "32", label: "Artisans vérifiés" },
  { value: "127", label: "Demandes ce mois" },
  { value: "4,7/5", label: "Note moyenne" },
  { value: "4h", label: "Délai moyen de réponse" },
];

const Stats = () => (
  <section className="bg-white">
    <div className="max-w-[1200px] mx-auto px-6 pt-4 pb-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-slate-200">
        {STATS.map((s, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col items-start px-6 py-7 lg:py-8",
              i > 0 && "lg:border-l border-slate-200",
              i === 1 && "border-l",
              i >= 2 && "border-t lg:border-t-0"
            )}
          >
            <div
              className="text-[34px] lg:text-[40px] font-bold tracking-tight leading-none"
              style={{ color: "#1e3a8a" }}
            >
              {s.value}
            </div>
            <div className="mt-3 text-[12.5px] text-slate-500 uppercase tracking-wide">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

window.Stats = Stats;
