import { Reveal } from "@/components/ds/Reveal";
import { TrustpilotStar } from "../TrustpilotStar";

type Testimonial = {
  name: string;
  trade: string;
  city: string;
  quote: string;
};

const TESTIMONIALS: ReadonlyArray<Testimonial> = [
  {
    name: "David L.",
    trade: "Chauffagiste",
    city: "Namur",
    quote:
      "J'ai signé 4 chantiers en 2 semaines grâce à DevisRapide. Aucun abonnement, je paie uniquement ce que j'accepte. Bien plus rentable que mes anciennes plateformes.",
  },
  {
    name: "Sophie M.",
    trade: "Couvreuse",
    city: "Liège",
    quote:
      "Le système d'Auto-Accept est génial. Je dors et les leads arrivent. Plus besoin de surveiller mon téléphone toute la journée pendant les chantiers.",
  },
  {
    name: "Karim B.",
    trade: "Électricien",
    city: "Charleroi",
    quote:
      "Le mode lead exclusif vaut vraiment son prix. Le client est qualifié, je ne suis pas en concurrence avec 5 autres, mon taux de signature est bien meilleur.",
  },
];

export function ProTestimonials() {
  return (
    <section
      id="temoignages"
      className="relative scroll-mt-20 lg:scroll-mt-24"
      style={{ backgroundColor: "#0f1e3d" }}
    >
      <div className="mx-auto max-w-[1350px] px-6 py-12 lg:py-20">
        <Reveal>
        <div className="mb-12 text-center">
          <span
            className="text-[12px] font-semibold uppercase tracking-[0.05em] sm:text-[13px]"
            style={{ color: "#fb923c" }}
          >
            Avis artisans
          </span>
          <h2 className="font-display mt-3 text-[28px] font-bold tracking-tight text-white lg:text-[36px]">
            Ils utilisent DevisRapide au quotidien
          </h2>
        </div>
        </Reveal>

        <Reveal delay={120}>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-lg border border-white/10 bg-[#1a2950] p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-semibold text-white"
                  aria-hidden
                >
                  {t.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")}
                </span>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-white">
                    {t.name}
                  </span>
                  <span className="text-[12px] text-slate-300">
                    {t.trade} · {t.city}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <TrustpilotStar key={i} size={14} />
                ))}
              </div>

              <p className="mt-4 text-[13.5px] leading-relaxed text-slate-200">
                &ldquo;{t.quote}&rdquo;
              </p>
            </article>
          ))}
        </div>
        </Reveal>
      </div>
    </section>
  );
}
