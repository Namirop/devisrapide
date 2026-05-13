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
 * Helper a appeler avant tout call Stripe API depuis les Server Actions
 * pour donner un message d'erreur explicite si la clef secrete est
 * absente, au lieu de laisser Stripe SDK renvoyer une erreur auth
 * cryptique. Retourne false si STRIPE_SECRET_KEY est manquante.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
