import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";
import { COMPANY } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Politique de confidentialité — DevisRapide",
  description:
    "Comment DevisRapide collecte, traite et protège les données personnelles des utilisateurs et professionnels, conformément au RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <LegalContent
      title="Politique de confidentialité"
      updatedAt="Mai 2026 (v1.0)"
    >
      <p>
        <strong>Applicabilité&nbsp;:</strong> utilisateurs (demandeurs) et
        professionnels partenaires.
      </p>

      <h2>Responsable du traitement et bases légales</h2>
      <p>
        Le traitement des données est géré par DevisRapide (
        {COMPANY.VAT_NUMBER}).
      </p>
      <p>Nos bases légales de traitement sont&nbsp;:</p>
      <ul>
        <li>
          <strong>L&apos;exécution d&apos;un contrat&nbsp;:</strong> pour
          assurer la mise en relation entre demandeurs et professionnels.
        </li>
        <li>
          <strong>L&apos;intérêt légitime&nbsp;:</strong> pour assurer la
          sécurité du site et la lutte contre la fraude.
        </li>
        <li>
          <strong>Le consentement explicite&nbsp;:</strong>{" "}notamment pour
          l&apos;activation des notifications PWA (push) et, à l&apos;avenir,
          d&apos;éventuels outils de mesure d&apos;audience.
        </li>
      </ul>

      <h2>Sécurité et chiffrement des données</h2>
      <p>
        Nous appliquons des mesures de sécurité rigoureuses pour protéger vos
        informations&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Chiffrement&nbsp;:</strong> tous les échanges de données sont
          sécurisés via le protocole SSL/HTTPS.
        </li>
        <li>
          <strong>Mots de passe&nbsp;:</strong>{" "}tous les mots de passe sont
          stockés de manière chiffrée (hachage) et sont illisibles, même pour
          l&apos;administration.
        </li>
        <li>
          <strong>Documents B2B&nbsp;:</strong>{" "}les documents déposés (PDF,
          plans, devis) sont stockés sur des serveurs sécurisés et ne sont
          accessibles qu&apos;aux professionnels ayant fait l&apos;acquisition
          légale du lead.
        </li>
      </ul>

      <h2>Données collectées et partage</h2>
      <ul>
        <li>
          <strong>Côté client&nbsp;:</strong> nom, prénom, email, téléphone,
          code postal, description du projet, documents joints.
        </li>
        <li>
          <strong>Côté professionnel&nbsp;:</strong>{" "}nom société, TVA, identité
          gérant, zones d&apos;intervention, historique wallet.
        </li>
        <li>
          <strong>Partage ciblé&nbsp;:</strong>{" "}les coordonnées de contact du
          client ne sont transmises qu&apos;à 3 professionnels maximum ayant
          acquis le lead.
        </li>
        <li>
          <strong>Engagement&nbsp;:</strong>{" "}DevisRapide s&apos;engage
          formellement à ne <strong>jamais</strong> revendre vos données à des
          tiers à des fins publicitaires.
        </li>
      </ul>

      <h2>Cookies et traçage</h2>
      <p>
        DevisRapide utilise uniquement des cookies strictement nécessaires au
        fonctionnement de la plateforme&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Cookies de session (essentiels)&nbsp;:</strong> pour maintenir
          la connexion à votre dashboard.
        </li>
        <li>
          <strong>Cookies de préférence&nbsp;:</strong>{" "}pour mémoriser vos
          réglages d&apos;affichage.
        </li>
      </ul>
      <p>
        <strong>Cookies analytiques (mesure d&apos;audience)&nbsp;:</strong>{" "}
        non utilisés au lancement V1. L&apos;activation future d&apos;un outil
        de mesure d&apos;audience anonymisée (par exemple Google Analytics)
        sera précédée d&apos;une mise à jour de cette politique et de
        l&apos;ajout d&apos;un véritable choix de consentement dans le bandeau
        cookies. Pour le détail des cookies actuellement déposés, consultez
        notre <a href="/cookies">politique cookies</a>.
      </p>

      <h2>Conservation et vos droits</h2>
      <ul>
        <li>
          <strong>Durée de conservation&nbsp;:</strong>{" "}3 ans pour les données
          prospects/clients après le dernier contact&nbsp;; 10 ans pour les
          documents de facturation pro (obligation légale belge).
        </li>
        <li>
          <strong>Vos droits&nbsp;:</strong>{" "}vous disposez d&apos;un droit
          d&apos;accès, de rectification, de suppression, de limitation et de
          portabilité de vos données.
        </li>
        <li>
          <strong>Réclamation&nbsp;:</strong>{" "}en cas de litige, vous avez le
          droit d&apos;introduire une réclamation auprès de l&apos;Autorité de
          protection des données (APD) en Belgique —{" "}
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

      <h2>Responsabilité des tiers</h2>
      <p>
        Le professionnel recevant les données d&apos;un client devient, dès la
        réception, responsable du traitement de celles-ci au sens du RGPD.
        DevisRapide décline toute responsabilité en cas d&apos;usage abusif des
        données par un tiers après leur transmission légale.
      </p>
    </LegalContent>
  );
}
