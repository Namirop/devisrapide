import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/LegalContent";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Politique cookies — DevisRapide",
  description:
    "Cookies utilisés par DevisRapide : strictement essentiels, aucun tracking publicitaire en V1.",
};

export default function CookiesPage() {
  return (
    <LegalContent
      title="Politique cookies"
      updatedAt="[À COMPLÉTER — Kamel]"
    >
      <h2>1. Principe</h2>
      <p>
        DevisRapide utilise <strong>uniquement des cookies essentiels</strong>{" "}
        au fonctionnement de la plateforme. Aucun cookie publicitaire, aucun
        traceur tiers, aucun pixel marketing n&apos;est déposé sur votre
        navigateur en V1.
      </p>
      <p>
        Aucun consentement n&apos;est requis pour les cookies strictement
        nécessaires (RGPD art. 82 / e-Privacy). Vous restez libre de les
        bloquer via les paramètres de votre navigateur, au prix de
        dysfonctionnements (perte de session, formulaire non soumis).
      </p>

      <h2>2. Cookies déposés</h2>
      <h3>2.1 Session et authentification</h3>
      <ul>
        <li>
          <strong>authjs.session-token</strong> — identifiant de session pour
          les comptes professionnels et l&apos;espace d&apos;administration.
          Durée&nbsp;: 30 jours. Émis par notre serveur uniquement.
        </li>
        <li>
          <strong>authjs.callback-url</strong>, <strong>authjs.csrf-token</strong>{" "}
          — sécurité de la procédure de connexion (protection CSRF, redirection
          post-login). Durée&nbsp;: durée de la session.
        </li>
      </ul>

      <h3>2.2 Paiement</h3>
      <ul>
        <li>
          <strong>Stripe</strong> — lors d&apos;une recharge wallet, Stripe
          dépose ses propres cookies sur son domaine de Checkout
          (<em>checkout.stripe.com</em>) pour la prévention de la fraude. Voir
          la{" "}
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

      <h3>2.3 Notifications push (optionnel)</h3>
      <p>
        Si vous activez les notifications push depuis votre dashboard pro, un
        identifiant d&apos;abonnement est stocké côté navigateur via
        l&apos;API Push standard (pas un cookie). Vous pouvez révoquer cet
        abonnement à tout moment depuis les paramètres de votre navigateur.
      </p>

      <h2>3. Pas de traceurs tiers</h2>
      <p>
        DevisRapide n&apos;utilise <strong>aucun</strong> des outils
        suivants&nbsp;: Google Analytics, Meta Pixel, TikTok Pixel, Hotjar,
        publicité programmatique, retargeting, fingerprinting. Si cela devait
        évoluer (analytics anonymisé, par exemple), une bannière de
        consentement sera mise en place.
      </p>

      <h2>4. Modifier vos préférences</h2>
      <p>
        Les cookies essentiels ne peuvent pas être désactivés depuis la
        plateforme. Pour les bloquer ou les supprimer, utilisez les paramètres
        de votre navigateur (Chrome, Firefox, Safari, Edge). Note&nbsp;: bloquer
        les cookies de session vous empêchera de vous connecter à votre espace
        pro ou admin.
      </p>

      <h2>5. Contact</h2>
      <p>
        Pour toute question sur cette politique cookies, contactez-nous à{" "}
        <a href={`mailto:${CONTACT.EMAIL}`}>{CONTACT.EMAIL}</a>.
      </p>
    </LegalContent>
  );
}
