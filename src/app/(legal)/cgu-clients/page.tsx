import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Clients — DevisRapide",
  description:
    "Conditions générales d'utilisation pour les clients particuliers de la plateforme DevisRapide.",
};

export default function CguClientsPage() {
  return (
    <LegalContent
      title="Conditions générales d'utilisation — Clients"
      updatedAt="[À COMPLÉTER — Kamel]"
    >
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales d&apos;utilisation
        («&nbsp;CGU&nbsp;») régissent l&apos;accès et l&apos;utilisation de la
        plateforme <strong>devisrapide.be</strong> (la «&nbsp;Plateforme&nbsp;»)
        par les utilisateurs particuliers (les «&nbsp;Clients&nbsp;») cherchant
        à obtenir des devis d&apos;artisans qualifiés.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        L&apos;accès à la Plateforme et le dépôt d&apos;une demande de devis
        sont entièrement gratuits pour les Clients. Aucune création de compte
        n&apos;est requise pour soumettre une demande. Le Client garantit que
        les informations qu&apos;il fournit sont exactes, complètes et à jour.
      </p>

      <h2>3. Demande de devis</h2>
      <p>
        En soumettant une demande de devis via le formulaire en plusieurs
        étapes, le Client&nbsp;:
      </p>
      <ul>
        <li>
          décrit son besoin de manière sincère et suffisamment précise pour
          permettre à un professionnel d&apos;y répondre&nbsp;;
        </li>
        <li>
          autorise DevisRapide à transmettre sa demande à un nombre limité
          d&apos;artisans professionnels disposant des compétences requises et
          opérant dans sa zone géographique&nbsp;;
        </li>
        <li>
          accepte d&apos;être contacté directement par les artisans ayant
          accepté de prendre en charge sa demande, par téléphone, SMS ou email.
        </li>
      </ul>

      <h2>4. Gratuité côté Client</h2>
      <p>
        Le service est et restera <strong>gratuit pour les Clients</strong>. Les
        artisans rémunèrent DevisRapide pour la mise en relation, ce qui ne crée
        aucune obligation financière pour le Client envers la Plateforme.
      </p>

      <h2>5. Relation contractuelle avec l&apos;artisan</h2>
      <p>
        Tout contrat (devis accepté, prestation, paiement, garanties) est conclu
        directement entre le Client et l&apos;artisan choisi. DevisRapide
        n&apos;est pas partie à ce contrat et ne peut être tenu responsable de
        l&apos;exécution, du contenu, ou des conséquences de cette relation
        contractuelle.
      </p>

      <h2>6. Données personnelles</h2>
      <p>
        Les données collectées sont traitées conformément à notre{" "}
        <a href="/confidentialite">politique de confidentialité</a>. Le Client
        dispose d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, de portabilité et d&apos;opposition sur ses données.
      </p>

      <h2>7. Durée et résiliation</h2>
      <p>
        Une demande de devis active expire automatiquement à l&apos;issue
        d&apos;un délai fixé par DevisRapide. Le Client peut demander
        l&apos;effacement de ses données à tout moment via l&apos;adresse&nbsp;:{" "}
        <a href="mailto:contact@devisrapide.be">contact@devisrapide.be</a>.
      </p>

      <h2>8. Modification des CGU</h2>
      <p>
        DevisRapide peut modifier les présentes CGU à tout moment. La date de
        dernière mise à jour figure en haut de cette page. Les modifications
        substantielles seront notifiées de manière visible sur la Plateforme.
      </p>

      <h2>9. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGU sont régies par le <strong>droit belge</strong>. Tout
        litige relatif à leur interprétation ou à leur exécution sera de la
        compétence exclusive des tribunaux de l&apos;arrondissement judiciaire
        de Bruxelles.
      </p>
    </LegalContent>
  );
}
