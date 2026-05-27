import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Pros — DevisRapide",
  description:
    "Conditions générales d'utilisation pour les professionnels partenaires de la plateforme DevisRapide : wallet, leads, remboursements.",
};

export default function CguProsPage() {
  return (
    <LegalContent
      title="Conditions générales d'utilisation — Professionnels"
      updatedAt="21 mai 2026 (v1.0)"
    >
      <p>
        <strong>Applicabilité&nbsp;:</strong> Professionnels partenaires
        utilisant DevisRapide.
      </p>

      <h2>Objet du service et nature du contrat</h2>
      <p>
        DevisRapide est une plateforme technologique d&apos;intermédiation B2B.
        Le droit de rétractation de 14 jours{" "}
        <strong>ne s&apos;applique pas</strong> aux recharges de crédits.
        DevisRapide ne garantit aucun volume minimal de leads, chiffre
        d&apos;affaires ou retour sur investissement.
      </p>

      <h2>Tarification, TVA et facturation</h2>
      <ul>
        <li>
          <strong>Affichage&nbsp;:</strong> Les prix sont exprimés TTC (TVA
          21&nbsp;% comprise).
        </li>
        <li>
          <strong>Facturation&nbsp;:</strong> Une facture des recharges
          effectuées sur la plateforme pourra être transmise électroniquement
          au professionnel en fin de mois. DevisRapide se réserve le droit de
          faire évoluer ultérieurement son système de facturation vers un
          fonctionnement automatisé. L&apos;ensemble des transactions et
          recharges reste accessible dans le dashboard professionnel.
        </li>
        <li>
          Les crédits «&nbsp;bonus&nbsp;» n&apos;ont aucune valeur fiscale.
        </li>
        <li>
          <strong>Évolutivité&nbsp;:</strong> DevisRapide peut modifier le prix
          des leads ou des packs à tout moment.
        </li>
      </ul>

      <h2>Système de wallet et règles de crédits</h2>
      <ul>
        <li>
          <strong>Provision&nbsp;:</strong> Les sommes versées constituent une
          provision <strong>non remboursable en numéraire</strong> (cash), même
          en cas de clôture de compte.
        </li>
        <li>
          <strong>Validité&nbsp;:</strong> Les crédits expirent après 12 mois
          sans nouvelle recharge.
        </li>
      </ul>

      <h2>Consommation des leads et Auto-Accept</h2>
      <ul>
        <li>
          <strong>Débit&nbsp;:</strong> Le débit est immédiat lors de
          l&apos;acceptation. Le service est alors considéré comme exécuté.
        </li>
        <li>
          <strong>Responsabilité Auto-Accept&nbsp;:</strong> Le professionnel
          reste seul responsable des paramètres configurés sur son système
          d&apos;Auto-Accept (distance, catégories, budget). Tout lead acheté
          via ce mode est définitif.
        </li>
        <li>
          <strong>Disponibilité&nbsp;:</strong> L&apos;exclusivité dépend de
          l&apos;état du marché et n&apos;est pas garantie en permanence.
        </li>
      </ul>

      <h2>Politique de remboursement (litiges)</h2>
      <p>
        Les leads achetés sur la plateforme correspondent à une prestation de
        mise en relation immédiatement exécutée dès l&apos;affichage des
        coordonnées du client.
      </p>
      <p>
        En conséquence, <strong>aucun remboursement en numéraire</strong>{" "}
        (cash) ne pourra être exigé pour les motifs suivants&nbsp;:
      </p>
      <ul>
        <li>client injoignable,</li>
        <li>absence de réponse,</li>
        <li>perte du chantier face à un concurrent,</li>
        <li>devis refusé,</li>
        <li>projet déjà réalisé ou abandonné,</li>
        <li>désaccord commercial avec le client.</li>
      </ul>
      <p>
        Seuls les cas de <strong>coordonnées manifestement erronées</strong>{" "}
        (par exemple&nbsp;: faux numéro de téléphone, numéro inexistant ou
        informations volontairement frauduleuses) signalés dans un délai
        <strong> maximum de 48 h</strong> pourront faire l&apos;objet
        d&apos;une vérification manuelle par l&apos;administration.
      </p>
      <p>
        Après analyse, DevisRapide pourra, à sa seule discrétion, accorder un
        <strong> crédit compensatoire</strong> directement sur le wallet
        professionnel.
      </p>

      <h2>Protection des données et confidentialité</h2>
      <p>
        Le professionnel s&apos;engage à utiliser les données clients
        uniquement dans le cadre du traitement des demandes reçues via la
        plateforme. Toute utilisation abusive, revente de données ou
        détournement de finalité entraînera l&apos;exclusion immédiate et
        d&apos;éventuelles poursuites judiciaires. L&apos;utilisation de
        systèmes de data scraping est formellement interdite.
      </p>

      <h2>Suspension et droit applicable</h2>
      <p>
        DevisRapide peut fermer un compte sans préavis en cas de fraude ou de
        comportement nuisible. Les présentes sont soumises au{" "}
        <strong>droit belge</strong>. Les tribunaux de l&apos;arrondissement
        de Bruxelles sont seuls compétents.
      </p>
    </LegalContent>
  );
}
