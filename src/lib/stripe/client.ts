import Stripe from "stripe";

// Version d'API épinglée : une mise à jour du SDK ne change pas l'API ciblée
// en silence. Le SDK refuse une clé vide à l'instanciation : STRIPE_SECRET_KEY
// doit être définie (valeur factice possible hors paiement) partout où ce
// module est importé.

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-08-26.dahlia",
  typescript: true,
});

/**
 * Tag `metadata.app` des Checkout Sessions : un compte Stripe partagé livre
 * chaque event à tous ses endpoints, le webhook ignore (200) les autres apps.
 */
export const STRIPE_APP_TAG = "devisrapide";

/** Permet un message lisible plutôt qu'une erreur d'auth du SDK. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
