import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";

import { sendRechargeConfirmationEmail } from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe/client";
import { getPackById } from "@/lib/stripe/packs";

// Webhook Stripe — endpoint public (Stripe POSTe sans authentification,
// la signature `stripe-signature` fait foi).
//
// Architecture :
// 1. Body RAW via req.text() (PAS json) car stripe.webhooks.constructEvent
//    a besoin du payload tel quel pour verifier la signature HMAC.
// 2. Verification signature → 400 si invalide.
// 3. Routage par event.type :
//    - checkout.session.completed → credit wallet + WalletTransaction
//      TOPUP + email confirmation (handleCheckoutCompleted).
//    - payment_intent.payment_failed → log only, no credit.
//    - autres → INSERT StripeWebhookEvent pour trace + return 200.
// 4. Idempotence : StripeWebhookEvent.stripeEventId @unique. INSERT en
//    PREMIER dans la transaction Prisma. Si conflit unique (Stripe
//    retry), Prisma throw P2002, on attrape → return 200 sans
//    re-crediter.
//
// La route est laissee publique par le proxy.ts (pas dans les branches
// /admin /dashboard /api/cron). Next 16 Route Handler n'applique pas
// de CSRF par defaut sur POST.

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
    // Capture warning : signature invalide = soit retry sur secret
    // tournant (cas legitime), soit tentative malicieuse. Tagger pour
    // filtrer dashboard Sentry.
    Sentry.captureMessage("Stripe webhook signature verification failed", {
      level: "warning",
      tags: { area: "stripe", reason: "invalid-signature" },
    });
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event);

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
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
 * Traitement du checkout.session.completed : credite le wallet + insere
 * WalletTransaction TOPUP + envoie email confirmation. Tout est atomique
 * via prisma.$transaction. Idempotence forcee par INSERT en premier sur
 * StripeWebhookEvent (stripeEventId @unique). Si retry Stripe : conflit
 * unique → return 200 sans re-crediter.
 */
async function handleCheckoutCompleted(
  event: Stripe.Event,
): Promise<NextResponse> {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const proProfileId = metadata.proProfileId;
  const packId = metadata.packId;
  const creditAmountCents = Number(metadata.creditAmountCents);

  // Validation metadata strict — sans ces 3 champs on ne peut rien
  // crediter. On log + on marque l'event comme processed (return 200)
  // pour eviter que Stripe retry infiniment un event qu'on ne saura
  // jamais traiter.
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
      // 1. INSERT StripeWebhookEvent EN PREMIER : pivot idempotence.
      //    Si Stripe retry le meme event, le @unique fait throw P2002
      //    et rollback tout le bloc → pas de double credit.
      await tx.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
          proProfileId,
        },
      });

      // 2. Lookup pro pour recuperer userId + email + companyName.
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

      // 3. Increment balance atomique (Prisma utilise SQL increment).
      const updated = await tx.proProfile.update({
        where: { id: proProfileId },
        data: { walletBalanceCents: { increment: creditAmountCents } },
        select: { walletBalanceCents: true },
      });

      // 4. INSERT WalletTransaction TOPUP avec les 2 references Stripe.
      //    stripePaymentIntentId + stripeCheckoutSessionId sont @unique →
      //    defense en profondeur contre double-credit hors idempotence
      //    StripeWebhookEvent.
      await tx.walletTransaction.create({
        data: {
          userId: pro.userId,
          type: "TOPUP",
          amountCents: creditAmountCents,
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
      // Conflit unique sur stripeEventId → event deja traite (Stripe retry).
      console.log("[stripe/webhook] already processed", {
        eventId: event.id,
        sessionId: session.id,
      });
      return new NextResponse("Already processed", { status: 200 });
    }
    console.error("[stripe/webhook] transaction failed", {
      eventId: event.id,
      sessionId: session.id,
      proProfileId,
      packId,
      creditAmountCents,
      error: err instanceof Error ? err.message : String(err),
    });
    Sentry.captureException(err, {
      tags: { area: "stripe", phase: "checkout-completed" },
      extra: { eventId: event.id, sessionId: session.id, proProfileId, packId },
    });
    // 500 → Stripe re-essaye automatiquement (retry exponential backoff).
    return new NextResponse("Internal error", { status: 500 });
  }

  // 5. Email APRES la transaction (fire-and-forget). On lookup pack
  //    label pour l'affichage email. Si email rate, on a tout de meme
  //    credite le wallet ; l'erreur Resend est loggee avec contexte
  //    complet par sendRechargeConfirmationEmail.
  const pack = await getPackById(packId);
  const walletUrl = buildWalletUrl();

  await sendRechargeConfirmationEmail({
    to: result.userEmail,
    proProfileId,
    packId,
    stripeEventId: event.id,
    companyName: result.companyName,
    packLabel: pack?.label ?? packId,
    amountCreditedCents: creditAmountCents,
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

/**
 * Log generique d'event Stripe sans crediter. Utilise pour les events
 * qu'on ne traite pas activement (payment_failed, autres types). Idempotent
 * via stripeEventId @unique : si conflit, on ignore silencieusement.
 */
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

/**
 * URL absolue du dashboard wallet pour les CTAs email. Prefere
 * NEXTAUTH_URL (env stable, configure par viewport prod/preview/dev).
 * Fallback localhost en dev local sans config.
 */
function buildWalletUrl(): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/dashboard/wallet`;
}
