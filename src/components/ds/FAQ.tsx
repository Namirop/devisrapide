import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";

// FAQ clients — version landing particuliers. Accordeon natif via
// <details>/<summary> (pas de JS, pas de dependance). Le chevron pivote
// au open via CSS [open] + transform. Symetrique au ProFAQ (pages /pros)
// mais avec son propre contenu maintenable independamment.

type Item = {
  q: string;
  a: React.ReactNode;
};

const FAQ_CLIENTS: ReadonlyArray<Item> = [
  {
    q: "Le service est-il vraiment gratuit ?",
    a: "Oui. Déposer une demande sur DevisRapide est 100% gratuit et sans engagement. Aucun frais ne vous sera jamais réclamé.",
  },
  {
    q: "Comment fonctionne DevisRapide ?",
    a: "Vous décrivez votre projet en quelques minutes via notre formulaire. Nous transmettons ensuite votre demande à un maximum de 3 professionnels qualifiés et disponibles dans votre région. Ceux que votre projet intéresse vous recontactent avec leur devis. Vous comparez et choisissez librement.",
  },
  {
    q: "Suis-je obligé d'accepter un devis ?",
    a: "Non. Vous restez totalement libre d'accepter ou de refuser les propositions reçues. Vous n'avez aucune obligation de conclusion de contrat.",
  },
  {
    q: "Combien de professionnels peuvent me contacter ?",
    a: "Jusqu'à 3 professionnels maximum reçoivent votre demande. Cela garantit une mise en concurrence saine sans vous submerger d'appels.",
  },
  {
    q: "Les professionnels sont-ils vérifiés ?",
    a: "Nous vérifions les coordonnées et le numéro de TVA (BCE) à l'inscription. Toutefois, nous recommandons toujours de vérifier les assurances (décennale / RC) avant toute signature.",
  },
  {
    q: "Combien de temps faut-il pour recevoir une réponse ?",
    a: "Cela dépend du métier et de l'urgence. Pour les dépannages, cela peut prendre quelques minutes. Pour les grands projets, comptez généralement 24h à 48h.",
  },
  {
    q: "Puis-je envoyer des photos ou des documents ?",
    a: "Pas pour le moment. Lors du lancement de la V1, les demandes de devis se font uniquement via une description texte détaillée afin de garder un processus rapide et simple. L'ajout de photos et de documents techniques pourra être proposé dans une future évolution de la plateforme.",
  },
  {
    q: "Mes données personnelles sont-elles protégées ?",
    a: "Oui. Vos données sont protégées selon le RGPD et ne sont transmises qu'aux 3 professionnels sélectionnés. Elles ne sont jamais revendues à des tiers.",
  },
  {
    q: "Puis-je supprimer ma demande ?",
    a: "Oui. Conformément au RGPD, vous pouvez demander à tout moment la suppression de votre projet et de vos données personnelles en contactant notre support.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[760px] px-6 pb-12 pt-8 lg:pb-16 lg:pt-10">
        <Reveal>
          <div className="mb-10 text-center">
            <h2 className="font-display text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
              Questions <span style={{ color: "#ea580c" }}>fréquentes</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="flex flex-col gap-3">
            {FAQ_CLIENTS.map((item) => (
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
                <div className="border-t border-slate-200 px-5 py-4 text-[14px] leading-relaxed text-slate-600 [&_li]:mb-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5">
                  {typeof item.a === "string" ? <p>{item.a}</p> : item.a}
                </div>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
