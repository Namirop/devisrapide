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
// Le typecheck du literal contre le type LatestApiVersion (interne au
// SDK) se fait via la signature du constructeur Stripe(). Si on upgrade
// le SDK et que Stripe drop "2026-04-22.dahlia" de l'union, TS errera
// ici directement → signal explicite de migrer la version d'API en
// meme temps que le SDK.

if (!process.env.STRIPE_SECRET_KEY) {
  // Production : throw a l'import. Build prod plantera plutot que de
  // boot une app incomplete. En dev local, le throw a lieu au premier
  // appel a une action Stripe, suffisant pour signaler.
  if (process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY is required in production");
  }
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});
