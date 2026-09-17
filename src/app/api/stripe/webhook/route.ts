import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";

import { reportIncident } from "@/lib/alerting";
import { buildWalletUrl } from "@/lib/email/helpers";
import { sendRechargeConfirmationEmail } from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_APP_TAG } from "@/lib/stripe/client";
import { getPackById } from "@/lib/stripe/packs";

// Webhook Stripe : endpoint public, authentifié par la signature
// `stripe-signature`, vérifiée sur le corps brut (d'où req.text()).
// Idempotence : `StripeWebhookEvent.stripeEventId` est unique ; un event
// rejoué par Stripe lève P2002 et reçoit 200 sans nouveau crédit.

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("[stripe/webhook] missing stripe-signature header");
    return new NextResponse("Missing signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    // Pas d'incident : une signature invalide vient d'une rotation de secret
    // (Stripe rejoue) ou d'un scan de l'endpoint public, c'est du bruit.
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    // Un paiement à notification différée (SEPA, virement…) émet `completed`
    // en "unpaid", puis `async_payment_succeeded` une fois les fonds reçus.
    // Deux event ids distincts : c'est le garde payment_status du handler,
    // pas l'idempotence, qui décide lequel crédite.
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return handleCheckoutCompleted(event);

    case "checkout.session.async_payment_failed": {
      const failed = event.data.object as Stripe.Checkout.Session;
      console.warn("[stripe/webhook] async payment failed", {
        eventId: event.id,
        sessionId: failed.id,
        proProfileId: failed.metadata?.proProfileId,
      });
      await logEvent(event);
      return new NextResponse("Async failure logged", { status: 200 });
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      // Compte partagé (cf. STRIPE_APP_TAG) : les metadata de la Session ne
      // sont pas recopiées sur l'intent, le tag vient de
      // `payment_intent_data.metadata`. Seul un tag étranger est filtré.
      const app = intent.metadata?.app;
      if (app && app !== STRIPE_APP_TAG) {
        console.log("[stripe/webhook] payment failure from another app", {
          eventId: event.id,
          app,
        });
        return new NextResponse("Ignored (other app)", { status: 200 });
      }
      console.warn("[stripe/webhook] payment failed", {
        eventId: event.id,
        paymentIntentId: intent.id,
        lastPaymentError: intent.last_payment_error?.message,
      });
      await logEvent(event);
      return new NextResponse("Failure logged", { status: 200 });
    }

    default: {
      console.log(
        `[stripe/webhook] event type not handled: ${event.type}`,
        { eventId: event.id },
      );
      await logEvent(event);
      return new NextResponse("Event logged", { status: 200 });
    }
  }
}

/**
 * Crédite le wallet (TOPUP) dans une transaction puis envoie l'email de
 * confirmation, uniquement pour une session payée dont les metadata
 * correspondent au pack en base.
 */
async function handleCheckoutCompleted(
  event: Stripe.Event,
): Promise<NextResponse> {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};

  // Compte Stripe partagé (cf. STRIPE_APP_TAG) : une session taguée pour une
  // autre application reçoit 200, sinon Stripe la rejoue pendant 3 jours.
  // Une session sans tag passe : la validation des metadata suffit.
  if (metadata.app && metadata.app !== STRIPE_APP_TAG) {
    console.log("[stripe/webhook] checkout from another app — skipping", {
      eventId: event.id,
      app: metadata.app,
    });
    return new NextResponse("Ignored (other app)", { status: 200 });
  }

  // `completed` part dès la fin du tunnel, même en "unpaid" : on attend
  // `async_payment_succeeded`, qui repasse ici en "paid". Ces events doivent
  // être activés sur l'endpoint Stripe, sinon le pro paie sans être crédité :
  // d'où un incident plutôt qu'un simple log.
  if (session.payment_status !== "paid") {
    await reportIncident("stripe.awaiting-async-payment", {
      context: {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        proProfileId: metadata.proProfileId,
        // Sans cet event dans les minutes qui suivent, l'endpoint n'y est
        // pas abonné : créditer à la main et corriger la config Stripe.
        followUpEvent: "checkout.session.async_payment_succeeded",
      },
    });
    await logEvent(event);
    return new NextResponse("Awaiting payment", { status: 200 });
  }

  const proProfileId = metadata.proProfileId;
  const packId = metadata.packId;
  const creditAmountCents = Number(metadata.creditAmountCents);

  // Metadata inexploitables : 200 malgré tout, pour que Stripe ne rejoue pas
  // un event qui ne pourra jamais être traité.
  if (
    !proProfileId ||
    !packId ||
    !Number.isFinite(creditAmountCents) ||
    creditAmountCents <= 0
  ) {
    console.error("[stripe/webhook] invalid metadata", {
      eventId: event.id,
      sessionId: session.id,
      metadata,
    });
    await logEvent(event);
    return new NextResponse("Invalid metadata", { status: 200 });
  }

  // Montant à créditer revalidé contre le pack en base (metadata altérées,
  // pack supprimé entre-temps) : sur discordance, 200 sans crédit.
  const canonicalPack = await getPackById(packId);
  if (!canonicalPack) {
    await reportIncident("stripe.pack-not-found", {
      context: { eventId: event.id, packId, creditAmountCents },
    });
    await logEvent(event);
    return new NextResponse("Pack not found", { status: 200 });
  }
  const expectedCents = canonicalPack.creditEur * 100;
  if (creditAmountCents !== expectedCents) {
    await reportIncident("stripe.amount-mismatch", {
      context: {
        eventId: event.id,
        packId,
        received: creditAmountCents,
        expected: expectedCents,
      },
    });
    await logEvent(event);
    return new NextResponse("Amount mismatch", { status: 200 });
  }

  // Même contrôle sur le montant payé, sauf conversion de devise (Adaptive
  // Pricing) : `amount_total` est alors dans la devise de l'acheteur, et
  // refuser un paiement légitime laisserait le pro payer sans être crédité.
  // Dans ce cas, on se contente de tracer.
  const expectedPaidCents = canonicalPack.priceEur * 100;
  const converted =
    session.currency !== "eur" || session.currency_conversion != null;
  if (!converted && session.amount_total !== expectedPaidCents) {
    await reportIncident("stripe.amount-total-mismatch", {
      context: {
        eventId: event.id,
        packId,
        received: session.amount_total,
        expected: expectedPaidCents,
      },
    });
    await logEvent(event);
    return new NextResponse("Amount total mismatch", { status: 200 });
  }
  if (converted) {
    console.warn("[stripe/webhook] currency converted — amount check skipped", {
      eventId: event.id,
      sessionId: session.id,
      currency: session.currency,
      amountTotal: session.amount_total,
    });
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  if (!paymentIntentId) {
    console.error("[stripe/webhook] no payment_intent on session", {
      eventId: event.id,
      sessionId: session.id,
    });
    await logEvent(event);
    return new NextResponse("No payment_intent", { status: 200 });
  }

  let result: {
    newBalance: number;
    userEmail: string;
    companyName: string;
  };
  try {
    result = await prisma.$transaction(async (tx) => {
      // En premier : un event rejoué lève P2002 et annule tout le bloc.
      await tx.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
          proProfileId,
        },
      });

      const pro = await tx.proProfile.findUnique({
        where: { id: proProfileId },
        select: {
          userId: true,
          companyName: true,
          user: { select: { email: true } },
        },
      });
      if (!pro) {
        throw new Error(`Pro profile not found: ${proProfileId}`);
      }

      // `increment` : mise à jour atomique côté SQL, sans verrou applicatif.
      const updated = await tx.proProfile.update({
        where: { id: proProfileId },
        data: { walletBalanceCents: { increment: creditAmountCents } },
        select: { walletBalanceCents: true },
      });

      // Références Stripe uniques : second rempart contre un double crédit.
      await tx.walletTransaction.create({
        data: {
          userId: pro.userId,
          type: "TOPUP",
          amountCents: creditAmountCents,
          // Payé et bonus séparés pour la facturation (/admin/finances) ;
          // amountCents reste le total crédité.
          amountPaidCents: canonicalPack.priceEur * 100,
          bonusCents: canonicalPack.bonusEur * 100,
          balanceAfterCents: updated.walletBalanceCents,
          stripePaymentIntentId: paymentIntentId,
          stripeCheckoutSessionId: session.id,
          description: `Recharge wallet — pack ${packId}`,
        },
      });

      return {
        newBalance: updated.walletBalanceCents,
        userEmail: pro.user.email,
        companyName: pro.companyName,
      };
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // stripeEventId déjà présent : event rejoué, déjà traité.
      console.log("[stripe/webhook] already processed", {
        eventId: event.id,
        sessionId: session.id,
      });
      return new NextResponse("Already processed", { status: 200 });
    }
    await reportIncident("stripe.credit-failed", {
      error: err,
      context: {
        eventId: event.id,
        sessionId: session.id,
        proProfileId,
        packId,
        creditAmountCents,
      },
    });
    // 500 : Stripe rejoue l'event plus tard.
    return new NextResponse("Internal error", { status: 500 });
  }

  // Email hors transaction : l'envoi ne lève pas d'exception (erreurs
  // journalisées par le sender), un échec n'annule donc pas le crédit.
  const walletUrl = buildWalletUrl();

  await sendRechargeConfirmationEmail({
    to: result.userEmail,
    proProfileId,
    packId,
    stripeEventId: event.id,
    companyName: result.companyName,
    packLabel: canonicalPack.label,
    amountCreditedCents: creditAmountCents,
    bonusCents: canonicalPack.bonusEur * 100,
    newBalanceCents: result.newBalance,
    stripePaymentIntentId: paymentIntentId,
    transactionDate: new Date(),
    walletUrl,
  });

  console.log("[stripe/webhook] recharge processed", {
    eventId: event.id,
    sessionId: session.id,
    proProfileId,
    packId,
    creditAmountCents,
    newBalance: result.newBalance,
  });

  return new NextResponse("Recharge processed", { status: 200 });
}

/** Trace un event sans crédit ; un doublon (P2002) est ignoré. */
async function logEvent(event: Stripe.Event): Promise<void> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (
      !(
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      )
    ) {
      console.error("[stripe/webhook] logEvent failed", {
        eventId: event.id,
        eventType: event.type,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

