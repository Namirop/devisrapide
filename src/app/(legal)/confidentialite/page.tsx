import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Politique de confidentialité — DevisRapide",
  description:
    "Comment DevisRapide collecte et traite vos données personnelles, conformément au RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <LegalContent
      title="Politique de confidentialité"
      updatedAt="[À COMPLÉTER — Kamel]"
    >
      <p>
        La présente politique décrit la manière dont DevisRapide collecte,
        utilise et protège les données personnelles des Clients et des Pros,
        conformément au Règlement général sur la protection des données
        (RGPD) et à la législation belge applicable.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est&nbsp;: [À COMPLÉTER —
        Kamel], dont le siège social est situé à [À COMPLÉTER — Kamel]. Pour
        toute question relative à vos données&nbsp;:{" "}
        <a href="mailto:contact@devisrapide.be">contact@devisrapide.be</a>.
      </p>

      <h2>2. Données collectées</h2>
      <h3>Côté Clients</h3>
      <ul>
        <li>
          Informations descriptives de la demande&nbsp;: univers, catégorie,
          sous-catégorie, description du besoin, urgence.
        </li>
        <li>
          Localisation&nbsp;: code postal, commune (déduite), adresse
          (facultative).
        </li>
        <li>
          Coordonnées&nbsp;: prénom, nom, email, numéro de téléphone.
        </li>
      </ul>
      <h3>Côté Pros</h3>
      <ul>
        <li>
          Identité et statut professionnel&nbsp;: raison sociale, numéro BCE,
          numéro de TVA, contact direct.
        </li>
        <li>
          Données techniques&nbsp;: historique des leads acceptés, mouvements
          du Wallet, journaux de connexion.
        </li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <ul>
        <li>
          Mise en relation entre les Clients et les Pros qualifiés
          disponibles dans la zone du Client.
        </li>
        <li>
          Gestion du compte Pro, du Wallet, des paiements, des transactions
          et de la facturation.
        </li>
        <li>
          Envoi d&apos;emails et notifications transactionnels (confirmation,
          acceptation d&apos;une demande, alertes).
        </li>
        <li>
          Amélioration de la qualité du service (analyse statistique anonyme).
        </li>
        <li>
          Respect des obligations légales et comptables.
        </li>
      </ul>

      <h2>4. Bases légales</h2>
      <p>
        Les traitements sont fondés sur&nbsp;:
      </p>
      <ul>
        <li>
          <strong>L&apos;exécution du contrat</strong> lors de la soumission
          d&apos;une demande de devis (Client) ou de la création de compte
          (Pro).
        </li>
        <li>
          <strong>Le consentement</strong> pour les communications optionnelles
          (notifications push, marketing).
        </li>
        <li>
          <strong>Les obligations légales</strong> (comptabilité, conservation
          des factures).
        </li>
        <li>
          <strong>L&apos;intérêt légitime</strong> de la Plateforme pour la
          sécurisation du service.
        </li>
      </ul>

      <h2>5. Destinataires des données</h2>
      <p>
        Les coordonnées du Client (nom, téléphone, email, adresse complète)
        ne sont transmises au Pro <strong>qu&apos;après acceptation</strong>{" "}
        de sa demande par celui-ci. Les sous-traitants techniques (hébergement
        Vercel, base Neon, emails Resend, paiements Stripe) accèdent aux
        données strictement nécessaires à leur prestation.
      </p>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li>
          Demandes de devis Clients&nbsp;: conservées 12 mois après la
          dernière interaction, puis archivées ou anonymisées.
        </li>
        <li>
          Comptes Pros&nbsp;: conservés tant que le compte est actif, puis 10
          ans après la dernière transaction pour les obligations comptables.
        </li>
        <li>
          Données de paiement&nbsp;: gérées par Stripe selon ses propres
          standards (PCI-DSS).
        </li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez à tout moment des droits
        suivants&nbsp;:
      </p>
      <ul>
        <li>Droit d&apos;accès à vos données&nbsp;;</li>
        <li>Droit de rectification&nbsp;;</li>
        <li>Droit à l&apos;effacement («&nbsp;droit à l&apos;oubli&nbsp;»)&nbsp;;</li>
        <li>Droit à la portabilité&nbsp;;</li>
        <li>Droit d&apos;opposition et de limitation du traitement&nbsp;;</li>
        <li>
          Droit d&apos;introduire une réclamation auprès de l&apos;Autorité de
          protection des données belge (APD)&nbsp;:{" "}
          <a
            href="https://www.autoriteprotectiondonnees.be"
            target="_blank"
            rel="noopener noreferrer"
          >
            autoriteprotectiondonnees.be
          </a>
          .
        </li>
      </ul>
      <p>
        Pour exercer ces droits&nbsp;:{" "}
        <a href="mailto:contact@devisrapide.be">contact@devisrapide.be</a>.
      </p>

      <h2>8. Cookies</h2>
      <p>
        DevisRapide utilise des cookies strictement nécessaires au
        fonctionnement du service (session, sécurité) et, sous réserve de
        votre consentement, des cookies de mesure d&apos;audience anonymisée.
        Vous pouvez gérer vos préférences à tout moment depuis votre
        navigateur.
      </p>

      <h2>9. Contact DPO</h2>
      <p>
        Délégué à la protection des données&nbsp;: [À COMPLÉTER — Kamel].
        Email dédié&nbsp;:{" "}
        <a href="mailto:contact@devisrapide.be">contact@devisrapide.be</a>.
      </p>
    </LegalContent>
  );
}
