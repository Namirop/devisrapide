// "Comment ça marche ?" — pas de card autour, numéros 01/02/03 GÉANTS navy, pas d'icônes Lucide.
// La pro CTA navy à droite reste intacte.

const HowItWorks = () => {
  const steps = [
    {
      n: "01",
      title: "Décrivez votre besoin",
      text: "Expliquez votre projet en quelques clics. Cela ne prend que 2 minutes.",
    },
    {
      n: "02",
      title: "Recevez jusqu'à 3 devis",
      text: "Nous transmettons votre demande à nos artisans qualifiés disponibles.",
    },
    {
      n: "03",
      title: "Choisissez le meilleur",
      text: "Comparez les devis reçus et choisissez l'artisan qui vous convient le mieux.",
    },
  ];

  return (
    <section id="how" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12">
          {/* Steps — pas de card, posé sur le fond */}
          <Reveal>
            <div className="h-full flex flex-col">
              <h2 className="text-[26px] lg:text-[32px] font-bold tracking-tight leading-tight">
                <span className="text-slate-900">Comment ça </span>
                <span style={{ color: "#ea580c" }}>marche</span>
                <span className="text-slate-900">&nbsp;?</span>
              </h2>

              <div className="mt-10 lg:mt-12 grid sm:grid-cols-3 gap-8 sm:gap-6">
                {steps.map((s) => (
                  <div key={s.n} className="flex flex-col">
                    <div
                      className="font-bold tracking-tight leading-none text-[56px] lg:text-[64px]"
                      style={{ color: "#1e3a8a" }}
                    >
                      {s.n}
                    </div>
                    <h3 className="mt-5 text-[15.5px] font-bold text-slate-900 leading-tight">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[13px] text-slate-500 leading-relaxed max-w-[260px]">
                      {s.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Pro CTA card (navy) — inchangé */}
          <Reveal delay={120}>
            <a
              href="#pros"
              className="relative block rounded-lg overflow-hidden h-full text-white shadow-sm group"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage: "radial-gradient(circle at 110% 20%, rgba(255,255,255,0.18), transparent 45%), radial-gradient(circle at 95% 95%, rgba(234,88,12,0.35), transparent 50%)",
                }}
              />
              <div className="absolute right-2 bottom-2 w-40 h-40 rounded-full bg-white/5 grid place-items-center text-white/15">
                <I.Shield size={120} strokeWidth={1.25} />
              </div>

              <div className="relative p-7 lg:p-8 flex flex-col h-full">
                <h3 className="text-[20px] lg:text-[22px] font-bold tracking-tight">
                  Vous êtes un professionnel&nbsp;?
                </h3>
                <p className="mt-2 text-[13px] text-white/75 leading-relaxed max-w-[320px]">
                  Rejoignez notre réseau d'artisans qualifiés et recevez des demandes
                  de clients près de chez vous.
                </p>

                <ul className="mt-5 space-y-2.5">
                  {["Demandes qualifiées", "Paiement à la performance", "Inscription gratuite"].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-[13px] text-white/90">
                      <I.Check size={16} strokeWidth={2.5} className="text-[#fb923c]" />
                      {t}
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <span className="inline-flex items-center gap-2 rounded-md border border-white/40 px-4 h-11 text-[14px] font-medium group-hover:bg-white/10 transition-colors">
                    Je m'inscris gratuitement
                    <I.ArrowRight size={16} strokeWidth={2} />
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

window.HowItWorks = HowItWorks;
