"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { requireProSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe/client";
import { getPackById } from "@/lib/stripe/packs";

const createCheckoutSchema = z.object({
  packId: z.string().min(1, "packId requis"),
});

export type CreateCheckoutResult =
  | { success: true; sessionUrl: string }
  | {
      success: false;
      code: "INVALID_INPUT" | "PACK_NOT_FOUND" | "USER_NOT_FOUND" | "INTERNAL";
      message: string;
    };

/**
 * Demarre une Stripe Checkout Session pour recharger le wallet du pro
 * connecte. Le crédit effectif arrive via le webhook /api/stripe/webhook
 * apres confirmation du paiement (pas ici, pour ne pas créditer en cas
 * de checkout abandonne).
 *
 * Le proProfileId + packId + creditAmountCents sont stockes dans la
 * metadata de la Session : le webhook handler les recupere depuis
 * event.data.object.metadata sans dependance a une lecture cote
 * server-side post-checkout.
 */
export async function createCheckoutSession(
  rawInput: unknown,
): Promise<CreateCheckoutResult> {
  // 1. Auth — le pro doit etre connecte VALIDATED.
  const { userId, proProfileId } = await requireProSession();

  // 2. Validation input.
  const parsed = createCheckoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Pack invalide.",
    };
  }
  const { packId } = parsed.data;

  // 3. Resolution pack depuis AppConfig.WALLET_PACKS.
  const pack = await getPackById(packId);
  if (!pack) {
    return {
      success: false,
      code: "PACK_NOT_FOUND",
      message: "Ce pack n'existe pas ou n'est plus disponible.",
    };
  }

  // 4. Email pour préfill Stripe Checkout (UX : pro n'a pas a re-taper).
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

  // 5. Origin pour les URLs de retour. headers() est typescript-typee
  //    async dans Next 16. On garde un fallback localhost pour le dev.
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // 6. Creation de la Stripe Checkout Session.
  //    - mode 'payment' = one-time payment (pas de subscription V1).
  //    - locale 'fr' pour la UI Stripe.
  //    - payment_method_types omis → Stripe Checkout active automatiquement
  //      card + Apple Pay + Google Pay + Bancontact (BE) si configures
  //      dans le dashboard Stripe.
  //    - metadata : pivots critiques pour le webhook handler. NE PAS
  //      MODIFIER sans aligner /api/stripe/webhook/route.ts en meme temps.
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
        proProfileId,
        packId,
        creditAmountCents: String(pack.creditEur * 100),
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
