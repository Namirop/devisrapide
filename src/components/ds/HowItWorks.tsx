import { Reveal } from "./Reveal";
import { ProCallout } from "./ProCallout";

// "Comment ca marche ?" — pas de cards autour des etapes.
// Numeros 01/02/03 navy GEANTS (56px → 64px lg). Marche orange sur "marche".
// Carte ProCallout navy a droite, ratio 1.6fr / 1fr en grille.

const STEPS = [
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
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
          <Reveal>
            <div className="flex h-full flex-col">
              <h2 className="text-[26px] font-bold leading-tight tracking-tight lg:text-[32px]">
                <span className="text-slate-900">Comment ça </span>
                <span style={{ color: "#ea580c" }}>marche</span>
                <span className="text-slate-900">&nbsp;?</span>
              </h2>

              <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:mt-12">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex flex-col">
                    <div
                      className="text-[56px] font-bold leading-none tracking-tight lg:text-[64px]"
                      style={{ color: "#1e3a8a" }}
                    >
                      {s.n}
                    </div>
                    <h3 className="mt-5 text-[15.5px] font-bold leading-tight text-slate-900">
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-slate-500">
                      {s.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ProCallout />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
