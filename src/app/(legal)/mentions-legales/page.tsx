import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Mentions légales — DevisRapide",
  description:
    "Mentions légales de la plateforme DevisRapide : éditeur, hébergeur, contact.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalContent title="Mentions légales" updatedAt="[À COMPLÉTER — Kamel]">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>devisrapide.be</strong> est édité par&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Raison sociale&nbsp;:</strong> [À COMPLÉTER — Kamel]
        </li>
        <li>
          <strong>Forme juridique&nbsp;:</strong> [À COMPLÉTER — Kamel]
        </li>
        <li>
          <strong>Numéro BCE (Banque-Carrefour des Entreprises)&nbsp;:</strong>{" "}
          [À COMPLÉTER — Kamel]
        </li>
        <li>
          <strong>Numéro de TVA&nbsp;:</strong> BE [À COMPLÉTER — Kamel]
        </li>
        <li>
          <strong>Siège social&nbsp;:</strong> [À COMPLÉTER — Kamel],
          Bruxelles, Belgique
        </li>
        <li>
          <strong>Email&nbsp;:</strong> contact@devisrapide.be
        </li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>[À COMPLÉTER — Kamel]</p>

      <h2>Hébergeur</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave
        #4133, Walnut, CA 91789, États-Unis. Les bases de données sont
        hébergées par <strong>Neon Inc.</strong> au sein de l&apos;Union
        Européenne (région EU-Central).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments composant le site (textes, logos,
        images, code source, charte graphique) est la propriété exclusive de
        l&apos;éditeur ou de ses partenaires et est protégé par les lois
        belges et internationales relatives à la propriété intellectuelle.
        Toute reproduction, même partielle, est interdite sans autorisation
        écrite préalable.
      </p>

      <h2>Responsabilité</h2>
      <p>
        DevisRapide met en relation des particuliers cherchant un artisan et
        des professionnels indépendants. Nous ne sommes pas partie au contrat
        conclu entre un client et un pro. Les devis, prestations, garanties
        et facturations relèvent exclusivement de la relation directe entre
        ces deux parties.
      </p>
      <p>
        Nous nous efforçons d&apos;assurer la disponibilité et
        l&apos;exactitude des informations diffusées sur ce site sans pouvoir
        en garantir l&apos;exhaustivité ou l&apos;absence
        d&apos;interruption.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative à ces mentions légales&nbsp;:{" "}
        <a href="mailto:contact@devisrapide.be">contact@devisrapide.be</a>
      </p>
    </LegalContent>
  );
}
