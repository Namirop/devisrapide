// Categories — grille 9 items, effet "tableau" avec séparateurs internes 1px slate-200.
// Pas de cards individuelles, pas de carré coloré derrière l'icône.
// SOS = rouge net + pill "24/7".

const CATEGORY_COUNTS = {
  toiture: "5 pros",
  plomberie: "4 pros",
  electricite: "4 pros",
  chauffage: "3 pros",
  peinture: "3 pros",
  menuiserie: "3 pros",
  maconnerie: "4 pros",
  carrelage: "3 pros",
  sos: "Dispo 24h/24",
};

const Categories = () => (
  <section id="categories" className="bg-white">
    <div className="max-w-[1200px] mx-auto px-6 pb-12 lg:pb-16">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-[22px] lg:text-[24px] font-bold text-slate-900 tracking-tight">
          Nos catégories les plus populaires
        </h2>
        <a href="#" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1e3a8a] hover:underline">
          Voir tous les métiers
          <I.ArrowRight size={14} strokeWidth={2} />
        </a>
      </div>

      {/* Grille tableau : bordures internes via gap + fond slate-200, cellules fond blanc */}
      <div
        className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 border border-slate-200"
        style={{ backgroundColor: "#e2e8f0", gap: "1px" }}
      >
        {CATEGORIES.map((c) => {
          const urgent = c.urgent;
          return (
            <a
              key={c.id}
              href="#"
              className="group relative flex flex-col items-center justify-center text-center gap-2.5 bg-white px-3 py-5 min-h-[120px] transition-colors duration-150 hover:bg-slate-50"
            >
              {urgent && (
                <span
                  className="absolute top-2 right-2 inline-flex items-center px-1.5 py-px text-[9.5px] font-bold tracking-wide text-white rounded-sm"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  24/7
                </span>
              )}
              <span
                className="grid place-items-center"
                style={{ color: urgent ? "#dc2626" : "#1e3a8a" }}
              >
                <c.Icon size={28} strokeWidth={1.5} />
              </span>
              <div className="text-[12.5px] font-semibold text-slate-900 leading-tight">{c.label}</div>
              <div className="text-[10.5px] leading-tight text-slate-500">
                {CATEGORY_COUNTS[c.id]}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  </section>
);

window.Categories = Categories;
