import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Politique cookies — DevisRapide",
  description:
    "Cookies utilisés par DevisRapide : essentiels uniquement au lancement V1, aucun traceur publicitaire.",
};

export default function CookiesPage() {
  return (
    <LegalContent title="Politique cookies" updatedAt="Mai 2026 (v1.0)">
      <h2>Principe</h2>
      <p>
        DevisRapide utilise{" "}
        <strong>uniquement des cookies essentiels</strong> au fonctionnement de
        la plateforme. Aucun cookie publicitaire, aucun pixel marketing,
        aucun traceur tiers n&apos;est déposé sur votre navigateur au
        lancement V1.
      </p>
      <p>
        Conformément au RGPD (art. 82 / e-Privacy), aucun consentement
        n&apos;est requis pour les cookies strictement nécessaires. Vous
        restez libre de les bloquer via les paramètres de votre navigateur,
        au prix de dysfonctionnements (perte de session, formulaire non
        soumis).
      </p>

      <h2>Cookies déposés</h2>

      <h3>Session et authentification</h3>
      <ul>
        <li>
          <strong>authjs.session-token</strong> — identifiant de session pour
          les comptes professionnels et l&apos;espace d&apos;administration.
          Durée&nbsp;: 30 jours. Émis par notre serveur uniquement.
        </li>
        <li>
          <strong>authjs.callback-url</strong>,{" "}
          <strong>authjs.csrf-token</strong> — sécurité de la procédure de
          connexion (protection CSRF, redirection post-login). Durée&nbsp;:
          durée de la session.
        </li>
      </ul>

      <h3>Préférences</h3>
      <ul>
        <li>
          <strong>cookies-acknowledged</strong> — mémorise que vous avez pris
          connaissance du bandeau d&apos;information cookies. Stocké en{" "}
          <em>localStorage</em> navigateur, jamais transmis au serveur.
        </li>
      </ul>

      <h3>Paiement (Stripe)</h3>
      <ul>
        <li>
          <strong>Stripe</strong> — lors d&apos;une recharge wallet, Stripe
          dépose ses propres cookies sur son domaine Checkout (
          <em>checkout.stripe.com</em>) pour la prévention de la fraude.
          Voir la{" "}
          <a
            href="https://stripe.com/cookies-policy/legal"
            target="_blank"
            rel="noopener noreferrer"
          >
            politique cookies Stripe
          </a>
          .
        </li>
      </ul>

      <h3>Notifications push (optionnel)</h3>
      <p>
        Si vous activez les notifications push depuis votre dashboard
        professionnel, un identifiant d&apos;abonnement est stocké côté
        navigateur via l&apos;API Push standard (techniquement pas un
        cookie). Vous pouvez révoquer cet abonnement à tout moment depuis
        les paramètres de votre navigateur ou de votre dashboard.
      </p>

      <h2>Cookies analytiques (mesure d&apos;audience)</h2>
      <p>
        <strong>Non utilisés au lancement V1.</strong> L&apos;activation
        future d&apos;un outil de mesure d&apos;audience anonymisée (par
        exemple Google Analytics) sera précédée d&apos;une mise à jour de
        cette politique et de l&apos;ajout d&apos;un véritable choix de
        consentement (Accepter / Refuser) dans le bandeau cookies.
      </p>

      <h2>Pas de traceurs tiers</h2>
      <p>
        DevisRapide n&apos;utilise <strong>aucun</strong>
        {" "}des outils suivants&nbsp;: Google Analytics, Meta Pixel, TikTok
        Pixel, Hotjar, publicité programmatique, retargeting, fingerprinting.
      </p>

      <h2>Modifier vos préférences</h2>
      <p>
        Les cookies essentiels ne peuvent pas être désactivés depuis la
        plateforme. Pour les bloquer ou les supprimer, utilisez les
        paramètres de votre navigateur (Chrome, Firefox, Safari, Edge).
        Note&nbsp;: bloquer les cookies de session vous empêchera de vous
        connecter à votre espace professionnel ou administrateur.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question sur cette politique cookies, contactez-nous à{" "}
        <a href={`mailto:${CONTACT.EMAIL}`}>{CONTACT.EMAIL}</a>.
      </p>
    </LegalContent>
  );
}
