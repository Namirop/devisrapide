import { CaretDown } from "@phosphor-icons/react/dist/ssr";

// FAQ pro — accordeon natif via <details>/<summary>. Pas de JS, pas de
// dependance lourde. Le chevron lucide pivote au open via CSS [open] +
// transform.

const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "Les crédits expirent-ils ?",
    a: "Non. Vos crédits sont valables sans limite de durée. Si vous mettez votre compte en pause, ils restent sur votre wallet et vous les retrouvez au déblocage.",
  },
  {
    q: "Puis-je choisir ma zone d'intervention ?",
    a: "Oui. À l'inscription vous choisissez un rayon : 30 km, 60 km ou toute la Wallonie + Bruxelles. Vous pouvez le modifier à tout moment depuis votre espace.",
  },
  {
    q: "Comment fonctionne le lead exclusif ?",
    a: "Un lead exclusif est attribué à un seul pro (pas de concurrence avec 2 autres comme en lead partagé). Il coûte 2,5× le prix d'un lead partagé. Le taux de conversion est bien meilleur.",
  },
  {
    q: "Y a-t-il un abonnement ou des frais cachés ?",
    a: "Aucun. L'inscription est gratuite, il n'y a pas de frais fixes mensuels. Vous rechargez votre wallet quand vous voulez (packs 70 €, 300 € ou 800 € avec bonus) et vous ne payez que les leads que vous acceptez.",
  },
];

export function ProFAQ() {
  return (
    <section id="faq" className="relative scroll-mt-24">
      <div className="mx-auto max-w-[760px] px-6 py-16 lg:py-20">
        <div className="mb-10 text-center">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "#ea580c" }}
          >
            FAQ
          </span>
          <h2 className="font-display mt-3 text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
            Questions fréquentes
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-md border border-slate-200 bg-white open:border-slate-300 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[15px] font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {item.q}
                <CaretDown
                  size={18}
                  weight="bold"
                  className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-[#1e3a8a]"
                  aria-hidden
                />
              </summary>
              <div className="border-t border-slate-200 px-5 py-4 text-[14px] leading-relaxed text-slate-600">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
