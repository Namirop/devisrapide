import Stripe from "stripe";

// Client Stripe centralise pour toute l'app : Server Actions de recharge,
// webhook handler, futures features (refund admin, dispute Sprint 4+).
//
// apiVersion : PIN explicite sur "2026-04-22.dahlia" (la version associee
// a stripe@22.x.x SDK). On ne laisse PAS Stripe utiliser sa
// LatestApiVersion par defaut, pour eviter qu'une bump mineure du SDK
// ne change l'API target en silence et casse les types des objets
// retournes.
//
// Pas de throw a l'import meme en prod : Vercel build prerendere les
// route handlers (dont /api/stripe/webhook) qui importent ce module.
// Throw a l'import ferait planter le build sur tout deploy ou
// STRIPE_SECRET_KEY n'est pas (encore) configure — c'est le cas en
// preview/staging tant qu'on n'a pas wire les env vars Stripe sur
// Vercel (planifie Sprint 6 Launch). Le runtime check vit dans les
// consumers (createCheckoutSession, webhook handler) qui retournent
// une erreur user-friendly si la clef manque.

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

/**
 * Tag d'application posé sur `metadata.app` de chaque Checkout Session.
 *
 * Le compte Stripe du client est PARTAGÉ avec un autre produit (Plarya).
 * Stripe livre chaque event à TOUS les endpoints webhook du compte qui
 * écoutent ce type d'event → un paiement Plarya tape aussi ce webhook,
 * et inversement. La signature ne discrimine pas (même compte signe les
 * deux endpoints).
 *
 * → createCheckoutSession pose `app: STRIPE_APP_TAG`, et le webhook
 *   ignore (200) toute checkout.session.completed taguée pour un AUTRE
 *   produit. Plarya fait le miroir avec son propre tag ("plarya").
 */
export const STRIPE_APP_TAG = "devisrapide";

/**
 * Helper a appeler avant tout call Stripe API depuis les Server Actions
 * pour donner un message d'erreur explicite si la clef secrete est
 * absente, au lieu de laisser Stripe SDK renvoyer une erreur auth
 * cryptique. Retourne false si STRIPE_SECRET_KEY est manquante.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
