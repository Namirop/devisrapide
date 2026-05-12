import { TrustpilotStar } from "./TrustpilotStar";
import { GoldStar } from "./GoldStar";
import { Reveal } from "./Reveal";

// Temoignages — pas de cards. Etoiles dorees haut, citation en typo large,
// signature nom bold + ville gris. Trustpilot dans une bande horizontale
// minimale separee, au-dessus.

const TESTIMONIALS = [
  {
    name: "Thomas D.",
    city: "Bruxelles",
    quote:
      "Très rapide et efficace. J'ai reçu 3 devis pour ma toiture en moins de 24h.",
  },
  {
    name: "Sophie L.",
    city: "Liège",
    quote:
      "Artisans professionnels et prix compétitifs. Je recommande sans hésiter.",
  },
  {
    name: "Marc V.",
    city: "Namur",
    quote: "Service gratuit, simple, ça change tout. Merci DevisRapide.",
  },
] as const;

export function Testimonials() {
  return (
    <section id="avis" className="relative overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
        aria-hidden
      />
      {/* Bande Trustpilot fine au-dessus des temoignages.
          Pas de bg-white : on laisse la grille de fond apparaitre. Les
          bordures haut/bas slate-200 peuvent croiser les lignes du
          pattern sans effet bizarre marquant (memes tons). */}
      <div className="relative mx-auto max-w-[1350px] px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-y border-slate-200 py-4 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Excellent
          </span>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <TrustpilotStar key={i} size={18} />
            ))}
            <TrustpilotStar size={18} half />
          </div>
          <span className="text-[13.5px] text-slate-700">
            <span className="font-bold text-slate-900">4,7</span>/5 sur
            Trustpilot
          </span>
          <span className="text-[12px] text-slate-500">·</span>
          <span className="text-[12px] text-slate-500">
            basé sur{" "}
            <span className="font-semibold text-slate-700">412 avis</span>{" "}
            vérifiés
          </span>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1350px] px-6 pb-14 pt-12 lg:pb-20 lg:pt-16">
        <div className="mb-10 text-center">
          <h2 className="text-[22px] font-bold tracking-tight text-slate-900 lg:text-[32px]">
            Ils nous font confiance
          </h2>
          <p className="text-[13px] text-slate-500">
            412 avis vérifiés sur Trustpilot
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <GoldStar key={s} size={16} />
                  ))}
                </div>

                <p className="mt-4 text-[17px] font-normal leading-[1.55] text-slate-800">
                  «&nbsp;{t.quote}&nbsp;»
                </p>

                <div className="mt-5 leading-tight">
                  <div className="text-[13.5px] font-semibold text-slate-900">
                    {t.name}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-slate-500">
                    {t.city}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
