import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";
import { COMPANY, CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Mentions légales — DevisRapide",
  description:
    "Mentions légales de la plateforme DevisRapide : éditeur, hébergement, responsabilité, anti-scraping.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalContent title="Mentions légales" updatedAt="Mai 2026 (v1.1)">
      <h2>Éditeur du site</h2>
      <p>
        Le site internet <strong>www.devisrapide.be</strong>{" "}est édité par&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Nom / Raison sociale&nbsp;:</strong> DevisRapide
        </li>
        <li>
          <strong>Forme juridique&nbsp;:</strong> Personne physique
        </li>
        <li>
          <strong>Siège social&nbsp;:</strong> {COMPANY.ADDRESS_LINE1},{" "}
          {COMPANY.ADDRESS_LINE2}, {COMPANY.COUNTRY}
        </li>
        <li>
          <strong>Numéro d&apos;entreprise (BCE/TVA)&nbsp;:</strong>{" "}
          {COMPANY.VAT_NUMBER}
        </li>
        <li>
          <strong>E-mail&nbsp;:</strong>{" "}
          <a href="mailto:contact@devisrapide.be">contact@devisrapide.be</a>
        </li>
        <li>
          <strong>Téléphone&nbsp;:</strong>{" "}
          <a href={`tel:${CONTACT.PHONE_E164}`}>{CONTACT.PHONE_DISPLAY}</a>
        </li>
      </ul>

      <h2>Responsable de publication</h2>
      <p>
        Le responsable de la publication et du contenu éditorial est{" "}
        <strong>Chibani Kemel</strong>.
      </p>

      <h2>Hébergement du site</h2>
      <p>Le site est hébergé par&nbsp;:</p>
      <ul>
        <li>
          <strong>Hébergement applicatif&nbsp;:</strong> Vercel Inc., 340 S Lemon
          Ave #4133, Walnut, CA 91789, USA
        </li>
        <li>
          <strong>Hébergement base de données&nbsp;:</strong> Neon (serveurs
          Union Européenne)
        </li>
        <li>
          <strong>Localisation des serveurs&nbsp;:</strong> Union Européenne
        </li>
      </ul>

      <h2>Activité et service</h2>
      <p>
        DevisRapide est une plateforme technologique agissant en tant
        qu&apos;intermédiaire de mise en relation entre des demandeurs
        (particuliers ou entreprises) et des professionnels du bâtiment et des
        services. DevisRapide n&apos;intervient pas dans la relation
        contractuelle, l&apos;exécution des travaux ou la facturation finale
        entre le client et le professionnel.
      </p>

      <h2>Limitation de responsabilité</h2>
      <ul>
        <li>
          <strong>Intermédiation&nbsp;:</strong>{" "}DevisRapide ne garantit pas la
          conclusion d&apos;un contrat, ni la qualité, la sécurité ou la
          légalité des travaux réalisés par les professionnels partenaires.
        </li>
        <li>
          <strong>Contrats&nbsp;:</strong>{" "}Les devis et contrats sont conclus
          directement entre le client et le professionnel. DevisRapide décline
          toute responsabilité en cas de litige relatif à l&apos;exécution du
          chantier.
        </li>
      </ul>

      <h2>Propriété intellectuelle et anti-scraping</h2>
      <ul>
        <li>
          <strong>Propriété&nbsp;:</strong>{" "}L&apos;ensemble des éléments
          constituant le site (logo, design, textes, algorithme de matching,
          base de données) est la propriété exclusive de DevisRapide.
        </li>
        <li>
          <strong>Interdiction de scraping&nbsp;:</strong>{" "}L&apos;extraction, la
          réutilisation ou la fouille de données (data scraping) de tout ou
          partie du contenu du site, par quelque moyen que ce soit (robots,
          logiciels, extraction manuelle), est formellement interdite. Toute
          violation fera l&apos;objet de poursuites judiciaires pour protéger
          nos droits de propriété intellectuelle et les données de nos
          utilisateurs.
        </li>
      </ul>

      <h2>Médiation et litiges</h2>
      <p>
        En cas de litige non résolu, le consommateur peut s&apos;adresser au{" "}
        <strong>Service de Médiation pour le Consommateur</strong> (Boulevard
        du Roi Albert II 8, 1000 Bruxelles —{" "}
        <a
          href="https://mediationconsommateur.be"
          target="_blank"
          rel="noopener noreferrer"
        >
          mediationconsommateur.be
        </a>
        ). En cas de procédure judiciaire, les tribunaux de
        l&apos;arrondissement de Bruxelles sont seuls compétents.
      </p>

      <h2>Accessibilité</h2>
      <p>
        L&apos;éditeur se réserve le droit de suspendre ou modifier le service
        pour maintenance ou mise à jour sans préavis.
      </p>
    </LegalContent>
  );
}
