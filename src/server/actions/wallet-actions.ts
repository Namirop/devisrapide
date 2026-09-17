"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { walletCheckoutLimiter } from "@/lib/ratelimit";
import { isStripeConfigured, stripe, STRIPE_APP_TAG } from "@/lib/stripe/client";
import { getPackById } from "@/lib/stripe/packs";

const createCheckoutSchema = z.object({
  packId: z.string().min(1, "packId requis"),
});

export type CreateCheckoutResult =
  | { success: true; sessionUrl: string }
  | {
      success: false;
      code:
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "PACK_NOT_FOUND"
        | "USER_NOT_FOUND"
        | "NOT_CONFIGURED"
        | "INTERNAL";
      message: string;
    };

/**
 * Démarre une Checkout Session Stripe pour recharger le wallet du pro. Le
 * crédit n'arrive que par le webhook, après paiement : un checkout abandonné
 * ne crédite rien. proProfileId, packId et montant voyagent en metadata, et
 * le webhook revalide le montant contre le pack en base.
 */
export async function createCheckoutSession(
  rawInput: unknown,
): Promise<CreateCheckoutResult> {
  const { userId, proProfileId } = await requireProSession();

  // 10 sessions / heure par pro : évite les créations en boucle (bug client,
  // tentative de flood des événements Stripe).
  const rl = await walletCheckoutLimiter().limit(proProfileId);
  if (!rl.success) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Trop de tentatives de paiement. Réessayez dans quelques minutes.",
    };
  }

  // Sans STRIPE_SECRET_KEY (environnement de preview), message explicite
  // plutôt qu'une erreur d'authentification Stripe.
  if (!isStripeConfigured()) {
    return {
      success: false,
      code: "NOT_CONFIGURED",
      message:
        "Le service de paiement n'est pas encore disponible. Contactez le support.",
    };
  }

  const parsed = createCheckoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Pack invalide.",
    };
  }
  const { packId } = parsed.data;

  // Montants lus dans AppConfig.WALLET_PACKS, jamais fournis par le client.
  const pack = await getPackById(packId);
  if (!pack) {
    return {
      success: false,
      code: "PACK_NOT_FOUND",
      message: "Ce pack n'existe pas ou n'est plus disponible.",
    };
  }

  // Email prérempli dans Stripe Checkout.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    return {
      success: false,
      code: "USER_NOT_FOUND",
      message: "Compte utilisateur introuvable.",
    };
  }

  // Origine des URLs de retour (repli localhost en développement).
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // payment_method_types omis : Checkout propose les moyens activés dans le
  // dashboard Stripe (carte, Bancontact…). Les metadata sont le contrat avec
  // /api/stripe/webhook : ne jamais les modifier sans lui.
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Pack ${pack.label}`,
              description:
                pack.bonusEur > 0
                  ? `${pack.creditEur}€ de crédits (bonus +${pack.bonusEur}€ inclus)`
                  : `${pack.creditEur}€ de crédits`,
            },
            unit_amount: pack.priceEur * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        // Tag d'application (compte Stripe partagé, cf. STRIPE_APP_TAG) : le
        // webhook ignore les sessions d'une autre application.
        app: STRIPE_APP_TAG,
        proProfileId,
        packId,
        creditAmountCents: String(pack.creditEur * 100),
      },
      // Stripe ne recopie pas la metadata de la Session sur le PaymentIntent :
      // sans ce doublon, le webhook ne distinguerait pas nos échecs
      // payment_intent.* de ceux d'une autre application du compte.
      payment_intent_data: {
        metadata: { app: STRIPE_APP_TAG },
      },
      success_url: `${origin}/dashboard/wallet?recharge=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/wallet?recharge=cancelled`,
    });

    if (!session.url) {
      console.error("[wallet/createCheckout] session.url manquant", {
        sessionId: session.id,
        proProfileId,
        packId,
      });
      return {
        success: false,
        code: "INTERNAL",
        message: "Stripe n'a pas retourne d'URL de paiement.",
      };
    }

    return { success: true, sessionUrl: session.url };
  } catch (err) {
    console.error("[wallet/createCheckout] Stripe error", {
      proProfileId,
      packId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      code: "INTERNAL",
      message:
        "Impossible de demarrer le paiement. Reessayez ou contactez le support.",
    };
  }
}
