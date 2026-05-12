import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Pros — DevisRapide",
  description:
    "Conditions générales d'utilisation pour les artisans professionnels de la plateforme DevisRapide.",
};

export default function CguProsPage() {
  return (
    <LegalContent
      title="Conditions générales d'utilisation — Professionnels"
      updatedAt="[À COMPLÉTER — Kamel]"
    >
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent la relation entre la plateforme{" "}
        <strong>devisrapide.be</strong> (la «&nbsp;Plateforme&nbsp;») et les
        artisans professionnels (les «&nbsp;Pros&nbsp;») souhaitant recevoir
        des demandes de devis émises par des particuliers en Belgique.
      </p>

      <h2>2. Conditions d&apos;inscription</h2>
      <p>
        Pour s&apos;inscrire en qualité de Pro, le candidat doit&nbsp;:
      </p>
      <ul>
        <li>
          être inscrit à la Banque-Carrefour des Entreprises (BCE) et exercer
          une activité légale d&apos;artisan, indépendant ou société, en
          Belgique&nbsp;;
        </li>
        <li>
          disposer d&apos;un numéro de TVA belge valide (le cas échéant)&nbsp;;
        </li>
        <li>
          être titulaire des éventuelles autorisations, accès professionnels
          ou assurances exigés par la législation belge pour exercer
          l&apos;activité concernée&nbsp;;
        </li>
        <li>
          accepter les présentes CGU lors de la création de son compte.
        </li>
      </ul>

      <h2>3. Validation manuelle par l&apos;administrateur</h2>
      <p>
        Toute inscription est soumise à une <strong>validation manuelle</strong>{" "}
        de l&apos;équipe DevisRapide. Cette validation vérifie la cohérence
        des informations fournies et l&apos;activité du Pro. La Plateforme se
        réserve le droit d&apos;accepter ou de refuser toute inscription, sans
        avoir à en justifier les motifs.
      </p>

      <h2>4. Modèle économique — Pay-per-lead</h2>
      <p>
        DevisRapide fonctionne selon un modèle{" "}
        <strong>«&nbsp;pay-per-lead&nbsp;»</strong>&nbsp;: le Pro paie
        uniquement pour les demandes de devis qu&apos;il accepte. Il ne paie
        rien à l&apos;inscription, rien pour recevoir des notifications, et
        rien pour les demandes refusées ou non acceptées.
      </p>

      <h2>5. Wallet et rechargement</h2>
      <p>
        Le Pro alimente son <strong>portefeuille en ligne</strong>{" "}
        («&nbsp;Wallet&nbsp;») via paiement sécurisé Stripe. Le solde
        disponible est débité automatiquement lorsqu&apos;une demande est
        acceptée. Le montant débité correspond au prix de la sous-catégorie
        au moment de l&apos;acceptation (snapshot prix), affiché de manière
        transparente avant l&apos;acceptation.
      </p>

      <h3>Packs et bonus de rechargement</h3>
      <p>
        Trois packs de rechargement sont proposés (montants indicatifs,
        susceptibles d&apos;évolution)&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Pack 70€</strong>&nbsp;: rechargement standard, sans bonus.
        </li>
        <li>
          <strong>Pack 300€</strong>&nbsp;: bonus de rechargement appliqué
          automatiquement au crédit du wallet.
        </li>
        <li>
          <strong>Pack 800€</strong>&nbsp;: bonus majoré appliqué
          automatiquement au crédit du wallet.
        </li>
      </ul>
      <p>
        Les montants exacts et les bonus en vigueur sont affichés dans le
        tunnel de paiement au moment du rechargement.
      </p>

      <h2>6. Lead partagé et lead exclusif</h2>
      <p>
        DevisRapide propose deux modes de prise de lead&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Lead partagé</strong>&nbsp;: jusqu&apos;à trois Pros peuvent
          accepter la même demande, le client reçoit donc trois contacts pour
          comparer.
        </li>
        <li>
          <strong>Lead exclusif</strong>&nbsp;: le Pro est le seul à recevoir
          le contact du client. Le prix exclusif correspond à environ{" "}
          <strong>2,5x le prix partagé</strong>.
        </li>
      </ul>

      <h2>7. Statut des demandes après acceptation</h2>
      <p>
        Après acceptation d&apos;une demande, le Pro doit prendre contact avec
        le Client dans un délai raisonnable. Le Pro est responsable du devis
        qu&apos;il propose, de l&apos;exécution de la prestation et du
        respect des obligations légales applicables (mentions devis, TVA à
        21&nbsp;%, garanties, etc.).
      </p>

      <h2>8. Suspension de compte</h2>
      <p>
        DevisRapide peut suspendre ou clôturer un compte Pro en cas de&nbsp;:
        non-respect des présentes CGU, plaintes répétées de clients,
        comportement contraire à l&apos;éthique de la Plateforme, ou
        utilisation frauduleuse. Le solde du Wallet restant peut être
        remboursé après vérification, sous réserve des éventuelles sommes
        dues.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Les données collectées sont traitées conformément à la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>10. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGU sont régies par le <strong>droit belge</strong>.
        Tout litige sera de la compétence exclusive des tribunaux de
        l&apos;arrondissement judiciaire de Bruxelles.
      </p>
    </LegalContent>
  );
}
