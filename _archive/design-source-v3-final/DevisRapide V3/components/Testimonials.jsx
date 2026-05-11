// Testimonials — pas de cards, contenu posé sur le fond.
// Étoiles orange en haut, texte « ... » en typo large, signature nom gras + ville gris.
// Trustpilot sort dans une bande horizontale minimale séparée.

const TESTIMONIALS = [
  {
    name: "Thomas D.",
    city: "Bruxelles",
    quote: "Très rapide et efficace. J'ai reçu 3 devis pour ma toiture en moins de 24h.",
  },
  {
    name: "Sophie L.",
    city: "Liège",
    quote: "Artisans professionnels et prix compétitifs. Je recommande sans hésiter.",
  },
  {
    name: "Marc V.",
    city: "Namur",
    quote: "Service gratuit, simple, ça change tout. Merci DevisRapide.",
  },
];

const Testimonials = () => (
  <section id="avis" className="bg-white">
    {/* Bande Trustpilot fine au-dessus des témoignages */}
    <div className="max-w-[1200px] mx-auto px-6">
      <div className="border-y border-slate-200 py-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
        <span
          className="text-[11px] uppercase tracking-[0.12em] font-semibold text-slate-500"
        >
          Excellent
        </span>
        <div className="flex items-center gap-0.5">
          {[0,1,2,3].map((i) => <TrustpilotStar key={i} size={18} />)}
          <TrustpilotStar size={18} half />
        </div>
        <span className="text-[13.5px] text-slate-700">
          <span className="font-bold text-slate-900">4,7</span>/5 sur Trustpilot
        </span>
        <span className="text-[12px] text-slate-500">·</span>
        <span className="text-[12px] text-slate-500">
          basé sur <span className="font-semibold text-slate-700">412 avis</span> vérifiés
        </span>
      </div>
    </div>

    <div className="max-w-[1200px] mx-auto px-6 pt-12 lg:pt-16 pb-14 lg:pb-20">
      <div className="text-center mb-10 lg:mb-12">
        <h2 className="text-[22px] lg:text-[26px] font-bold text-slate-900 tracking-tight">
          Ils nous font confiance
        </h2>
        <p className="mt-2 text-[13px] text-slate-500">
          412 avis vérifiés sur Trustpilot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 80}>
            <div className="flex flex-col">
              {/* Étoiles orange en haut */}
              <div className="flex items-center gap-0.5">
                {[0,1,2,3,4].map((s) => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="mt-4 text-[17px] leading-[1.55] text-slate-800 font-normal">
                «&nbsp;{t.quote}&nbsp;»
              </p>

              {/* Signature sobre */}
              <div className="mt-5 leading-tight">
                <div className="text-[13.5px] font-semibold text-slate-900">{t.name}</div>
                <div className="text-[12.5px] text-slate-500 mt-0.5">{t.city}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

window.Testimonials = Testimonials;
