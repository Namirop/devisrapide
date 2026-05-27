import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Clients — DevisRapide",
  description:
    "Conditions générales d'utilisation pour les particuliers et entreprises déposant une demande sur DevisRapide.",
};

export default function CguClientsPage() {
  return (
    <LegalContent
      title="Conditions générales d'utilisation — Clients"
      updatedAt="21 mai 2026 (v1.2)"
    >
      <p>
        <strong>Applicabilité&nbsp;:</strong> Particuliers et entreprises (B2B)
        déposant une demande sur DevisRapide.
      </p>

      <h2>Objet du service</h2>
      <p>
        DevisRapide est une plateforme technologique agissant en tant
        qu&apos;intermédiaire de mise en relation entre des demandeurs et des
        professionnels du bâtiment et des services. DevisRapide n&apos;exécute
        aucun travaux et n&apos;intervient pas comme entreprise de construction
        ou maître d&apos;œuvre.
      </p>

      <h2>Gratuité et liberté du client</h2>
      <ul>
        <li>
          <strong>Gratuité&nbsp;:</strong> Le dépôt d&apos;une demande est
          entièrement gratuit pour le demandeur.
        </li>
        <li>
          <strong>Responsabilité&nbsp;:</strong> Le choix final du professionnel
          et la conclusion d&apos;un contrat relèvent exclusivement de la
          responsabilité du client. Le client reste libre d&apos;accepter ou de
          refuser les devis proposés.
        </li>
      </ul>

      <h2>Fonctionnement et délais</h2>
      <ul>
        <li>
          <strong>Transmission&nbsp;:</strong> Le projet est transmis à
          <strong> maximum 3 professionnels</strong>.
        </li>
        <li>
          <strong>Absence de garantie de délai&nbsp;:</strong> Les délais de
          réponse des professionnels peuvent varier selon leur charge de travail
          et la localisation du projet. DevisRapide ne garantit aucune réponse
          systématique.
        </li>
      </ul>

      <h2>Obligations et lutte contre la fraude</h2>
      <ul>
        <li>
          <strong>Sincérité&nbsp;:</strong> Le client s&apos;engage à fournir
          des informations exactes. En validant sa demande, il accepte
          d&apos;être contacté par téléphone ou e-mail par les professionnels
          sélectionnés.
        </li>
        <li>
          <strong>Sanctions&nbsp;:</strong> Toute demande jugée abusive,
          frauduleuse ou fictive pourra être supprimée sans préavis par la
          plateforme.
        </li>
      </ul>

      <h2>Limitation de responsabilité</h2>
      <p>
        DevisRapide décline toute responsabilité concernant la qualité des
        travaux, les sinistres ou la solvabilité des entreprises. Il appartient
        au client de vérifier les assurances et certifications du professionnel
        choisi.
      </p>

      <h2>Propriété intellectuelle et anti-scraping</h2>
      <p>
        Tous les éléments du site sont protégés. L&apos;utilisation de robots
        ou de systèmes de collecte automatisée de données (scraping) est
        strictement interdite.
      </p>

      <h2>Modification des conditions</h2>
      <p>
        DevisRapide se réserve le droit de modifier les présentes CGU à tout
        moment. La version applicable est celle en vigueur au moment de
        l&apos;utilisation du service.
      </p>

      <h2>Droit applicable et juridiction</h2>
      <p>
        Les présentes sont soumises au <strong>droit belge</strong>. En cas de
        litige, les tribunaux de l&apos;arrondissement de Bruxelles sont seuls
        compétents.
      </p>
    </LegalContent>
  );
}
