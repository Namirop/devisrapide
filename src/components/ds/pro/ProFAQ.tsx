import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import { Reveal } from "@/components/ds/Reveal";

// FAQ — accordeon natif via <details>/<summary>. Pas de JS, pas de
// dependance. Le chevron pivote au open via CSS [open] + transform.
//
// Contenu officiel Kamel (mai 2026) en 2 sections :
//  - Clients : 8 questions sur le service de mise en relation
//  - Pros : 12 questions sur wallet, leads, Auto-Accept, remboursements

type Item = {
  q: string;
  // string = paragraphe simple. ReactNode pour les réponses contenant
  // listes ou paragraphes multiples (lead exclusif, Auto-Accept, etc.).
  a: React.ReactNode;
};

const FAQ_CLIENTS: ReadonlyArray<Item> = [
  {
    q: "Le service est-il vraiment gratuit ?",
    a: "Oui. Déposer une demande sur DevisRapide est 100% gratuit et sans engagement. Aucun frais ne vous sera jamais réclamé.",
  },
  {
    q: "Suis-je obligé d'accepter un devis ?",
    a: "Non. Vous restez totalement libre d'accepter ou de refuser les propositions reçues. Vous n'avez aucune obligation de conclusion de contrat.",
  },
  {
    q: "Combien de professionnels vont me contacter ?",
    a: "Jusqu'à 3 professionnels maximum reçoivent votre demande. Cela garantit une mise en concurrence saine sans vous submerger d'appels.",
  },
  {
    q: "Combien de temps faut-il pour recevoir une réponse ?",
    a: "Cela dépend du métier et de l'urgence. Pour les dépannages, cela peut prendre quelques minutes. Pour les grands projets, comptez généralement 24h à 48h.",
  },
  {
    q: "Puis-je supprimer ma demande ?",
    a: "Oui. Conformément au RGPD, vous pouvez demander à tout moment la suppression de votre projet et de vos données personnelles en contactant notre support.",
  },
  {
    q: "Les artisans sont-ils vérifiés ?",
    a: "Nous vérifions les coordonnées et le numéro de TVA à l'inscription. Toutefois, nous recommandons toujours de vérifier les assurances (décennale / RC) avant toute signature.",
  },
  {
    q: "Puis-je envoyer des photos ou des documents ?",
    a: "Pas pour le moment. Lors du lancement de la V1, les demandes de devis se font uniquement via une description texte détaillée afin de garder un processus rapide et simple. L'ajout de photos et de documents techniques pourra être proposé dans une future évolution de la plateforme.",
  },
  {
    q: "Mes données personnelles sont-elles protégées ?",
    a: "Oui. Vos données sont protégées selon le RGPD et ne sont transmises qu'aux 3 professionnels sélectionnés. Elles ne sont jamais revendues à des tiers.",
  },
];

const FAQ_PROS: ReadonlyArray<Item> = [
  {
    q: "La création d'un compte professionnel est-elle gratuite ?",
    a: "Oui. L'inscription sur DevisRapide est entièrement gratuite et sans engagement. Vous pouvez créer votre profil professionnel, sélectionner vos métiers et configurer votre zone d'intervention librement. Vous ne payez que lorsque vous décidez d'accepter un lead correspondant à votre activité.",
  },
  {
    q: "Dois-je obligatoirement recharger mon Wallet pour recevoir des leads ?",
    a: "Oui. Un solde disponible sur votre Wallet est nécessaire pour pouvoir accepter et recevoir des leads sur la plateforme. Les professionnels disposant d'un Wallet actif ainsi qu'un système Auto-Accept configuré peuvent également être prioritaires sur certaines opportunités afin de garantir une réactivité maximale aux clients. De manière occasionnelle, DevisRapide peut également attribuer certains leads offerts ou bonus promotionnels à des professionnels actifs et réguliers afin de faire découvrir la plateforme ou récompenser leur fidélité.",
  },
  {
    q: "Puis-je choisir ma zone géographique ?",
    a: "Absolument. Vous définissez vous-même votre rayon d'action (en km) autour de votre localité. Vous ne recevez que les chantiers dans votre zone de déplacement habituelle.",
  },
  {
    q: "Qu'est-ce qu'un lead exclusif ?",
    a: (
      <>
        <p>
          Un lead exclusif est une demande de devis réservée à un seul
          professionnel sur la plateforme&nbsp;: vous. Contrairement aux leads
          partagés, aucun autre artisan concurrent ne reçoit les coordonnées du
          client via DevisRapide. Vous êtes donc le seul à pouvoir contacter le
          demandeur à travers la plateforme pour ce projet.
        </p>
        <p>Ce mode est particulièrement recommandé pour&nbsp;:</p>
        <ul>
          <li>les chantiers à forte valeur,</li>
          <li>les projets urgents,</li>
          <li>
            ou les professionnels souhaitant maximiser leurs chances de
            signature.
          </li>
        </ul>
        <p>
          L&apos;avantage principal&nbsp;: vous évitez la mise en concurrence
          directe et augmentez considérablement vos probabilités de conversion
          en étant le seul interlocuteur proposé au client. Le tarif d&apos;un
          lead exclusif est équivalent à <strong>x2.5</strong> du prix
          d&apos;un lead partagé standard.
        </p>
      </>
    ),
  },
  {
    q: "Comment fonctionne l'Auto-Accept ?",
    a: (
      <>
        <p>
          L&apos;Auto-Accept permet aux professionnels de recevoir
          automatiquement les leads correspondant exactement à leurs critères,
          même lorsqu&apos;ils sont occupés sur chantier ou indisponibles.
        </p>
        <p>Vous définissez vous-même&nbsp;:</p>
        <ul>
          <li>vos métiers et sous-catégories,</li>
          <li>votre zone d&apos;intervention,</li>
          <li>votre budget maximum,</li>
          <li>et le type de leads souhaités (standard ou exclusif).</li>
        </ul>
        <p>
          Lorsqu&apos;une nouvelle demande correspond à vos paramètres, le
          système peut l&apos;accepter automatiquement pour vous et débiter
          directement votre Wallet.
        </p>
        <p>
          <strong>Avantage&nbsp;:</strong> vous gagnez un temps précieux et
          évitez de rater des chantiers rentables simplement parce qu&apos;un
          concurrent a été plus rapide. L&apos;Auto-Accept augmente fortement
          vos chances d&apos;être parmi les premiers à contacter le client, ce
          qui améliore généralement le taux de conversion et les opportunités
          de signature.
        </p>
      </>
    ),
  },
  {
    q: "Puis-je désactiver les notifications ?",
    a: "Oui. Vous pouvez gérer vos alertes (Push PWA) directement dans vos paramètres. Très utile pour mettre votre compte en pause pendant vos congés.",
  },
  {
    q: "Les crédits sont-ils remboursables ?",
    a: "Les crédits ajoutés sur le Wallet constituent une provision de service destinée à l'achat futur de leads sur la plateforme. Conformément à nos conditions B2B, ils ne sont pas remboursables en numéraire. En cas de problème avéré sur un lead (exemple : faux numéro ou informations manifestement frauduleuses), notre équipe peut également accorder un crédit compensatoire après vérification manuelle afin de garantir un système équitable pour les professionnels sérieux.",
  },
  {
    q: "Quand vais-je recevoir mes premiers leads ?",
    a: "Cela dépend principalement de votre métier, de votre zone d'intervention et de la disponibilité des demandes dans votre région. Les professionnels ayant un profil complet, un Wallet actif et des notifications activées maximisent généralement leurs chances de recevoir rapidement des opportunités.",
  },
  {
    q: "Comment les professionnels sont-ils sélectionnés pour recevoir les leads ?",
    a: (
      <>
        <p>
          Les demandes sont distribuées automatiquement selon plusieurs critères
          afin de garantir une mise en relation pertinente et équilibrée&nbsp;:
        </p>
        <ul>
          <li>métier sélectionné,</li>
          <li>zone géographique,</li>
          <li>disponibilité des professionnels,</li>
          <li>paramètres configurés dans le dashboard,</li>
          <li>et réactivité globale sur la plateforme.</li>
        </ul>
        <p>
          Le système favorise les professionnels actifs et disponibles tout en
          maintenant une distribution cohérente des opportunités afin
          d&apos;éviter une concentration excessive des leads sur un petit
          nombre de comptes.
        </p>
      </>
    ),
  },
  {
    q: "Puis-je mettre mon compte en pause ?",
    a: "Oui. Vous pouvez à tout moment désactiver vos notifications ou suspendre temporairement votre activité depuis votre dashboard professionnel. Cela vous permet de gérer librement votre disponibilité, notamment pendant vos congés ou lorsque votre planning est déjà complet.",
  },
  {
    q: "Que faire si le numéro du client est faux ?",
    a: (
      <p>
        Si vous constatez qu&apos;un numéro est incorrect, inexistant ou
        manifestement frauduleux, vous pouvez contacter notre équipe dans un
        délai maximum de 48&nbsp;h à l&apos;adresse&nbsp;:{" "}
        <a
          href="mailto:contact@devisrapide.be"
          className="font-medium text-[#1e3a8a] underline-offset-2 hover:underline"
        >
          contact@devisrapide.be
        </a>
        . Après vérification manuelle du dossier par notre administration, un
        crédit compensatoire pourra être accordé directement sur votre Wallet
        afin de garantir un système équitable pour les professionnels sérieux.
      </p>
    ),
  },
  {
    q: "Puis-je recevoir des demandes de particuliers ou d'entreprises ?",
    a: "Oui. Les professionnels inscrits sur DevisRapide peuvent recevoir des demandes provenant aussi bien de particuliers que d'entreprises locales via le tunnel classique de demande de devis. Concernant les « Grands Projets », appels d'offres importants ou dossiers techniques d'envergure (copropriétés, syndics, communes, marchés publics, gros chantiers B2B), cette section premium affichée en bas de page est actuellement en préparation et sera ouverte dans une future évolution de la plateforme.",
  },
];

function FAQList({ items }: { items: ReadonlyArray<Item> }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
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
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display mb-5 mt-2 text-[20px] font-bold tracking-tight text-slate-900 lg:text-[22px]">
      {children}
    </h3>
  );
}

export function ProFAQ() {
  return (
    <section id="faq" className="relative scroll-mt-20 lg:scroll-mt-24">
      <div className="mx-auto max-w-[760px] px-6 py-12 lg:py-20">
        <Reveal>
          <div className="mb-10 text-center">
            <span
              className="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] sm:tracking-[0.16em]"
              style={{ color: "#ea580c" }}
            >
              FAQ
            </span>
            <h2 className="font-display mt-3 text-[28px] font-bold tracking-tight text-slate-900 lg:text-[36px]">
              Questions fréquentes
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <SectionTitle>Pour les clients</SectionTitle>
          <FAQList items={FAQ_CLIENTS} />
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-12">
            <SectionTitle>Pour les professionnels</SectionTitle>
            <FAQList items={FAQ_PROS} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
