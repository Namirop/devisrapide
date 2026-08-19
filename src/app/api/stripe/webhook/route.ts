import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";

import { reportIncident } from "@/lib/alerting";
import { buildWalletUrl } from "@/lib/email/helpers";
import { sendRechargeConfirmationEmail } from "@/lib/email/sender";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_APP_TAG } from "@/lib/stripe/client";
import { getPackById } from "@/lib/stripe/packs";

// Webhook Stripe — endpoint public (Stripe POSTe sans authentification,
// la signature `stripe-signature` fait foi).
//
// Architecture :
// 1. Body RAW via req.text() (PAS json) car stripe.webhooks.constructEvent
//    a besoin du payload tel quel pour verifier la signature HMAC.
// 2. Verification signature → 400 si invalide.
// 3. Routage par event.type :
//    - checkout.session.completed et checkout.session.async_payment_succeeded
//      → credit wallet + WalletTransaction TOPUP + email confirmation
//      (handleCheckoutCompleted, qui ne credite que si payment_status
//      vaut "paid").
//    - checkout.session.async_payment_failed → log only, no credit.
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
    // Pas d'incident : une signature invalide, c'est soit un retry pendant
    // une rotation de secret (legitime, Stripe rejoue), soit un scan sur un
    // endpoint public. Alerter dessus reviendrait a alerter sur du bruit.
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    // Les deux menent au meme traitement. Un moyen de paiement a
    // notification differee (SEPA Direct Debit, Bacs/ACH, virement, Pay by
    // Bank, vouchers) emet `completed` avec payment_status "unpaid", puis
    // `async_payment_succeeded` une fois les fonds confirmes. Les deux
    // events portent des id distincts, donc l'idempotence par
    // StripeWebhookEvent les laisse passer tous les deux — c'est le garde
    // payment_status dans le handler qui decide lequel credite.
    //
    // Aucun moyen actuellement actif (carte, Bancontact, EPS, Klarna, Link)
    // n'est dans ce cas : ils arrivent tous en "paid". Le branchement est la
    // pour le jour ou SEPA sera active — et parce que se fier a `completed`
    // seul est un contresens, l'event ne dit pas que l'argent est arrive.
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
      // Compte partagé (cf. STRIPE_APP_TAG) : le tag vient ici de
      // `payment_intent_data.metadata` posé par createCheckoutSession, la
      // metadata de la Session n'étant pas recopiée sur l'intent. Un tag
      // ABSENT ne prouve pas que l'event vient d'ailleurs (intent antérieur
      // à ce marquage) → on ne filtre que sur un tag explicitement étranger.
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

  // Compte Stripe PARTAGÉ avec un autre produit (Plarya) — cf.
  // STRIPE_APP_TAG. Stripe livre chaque event à tous les endpoints du
  // compte. On ignore (200, sinon Stripe retry 3 jours) toute session
  // taguée pour un AUTRE app. On ne rejette PAS les sessions sans tag
  // (sessions legacy créées avant ce déploiement) : la validation
  // metadata ci-dessous (proProfileId/packId) les protège déjà.
  if (metadata.app && metadata.app !== STRIPE_APP_TAG) {
    console.log("[stripe/webhook] checkout from another app — skipping", {
      eventId: event.id,
      app: metadata.app,
    });
    return new NextResponse("Ignored (other app)", { status: 200 });
  }

  // Fonds reellement encaisses ? `checkout.session.completed` se declenche
  // des la fin du tunnel, y compris avec payment_status "unpaid" pour les
  // moyens de paiement a notification differee. Crediter ici reviendrait a
  // offrir des leads avant l'encaissement. On attend
  // `checkout.session.async_payment_succeeded`, qui repasse par ce handler
  // avec payment_status "paid" ; `async_payment_failed` clot le cas
  // contraire.
  //
  // ⚠️ DEPEND DE LA CONFIG STRIPE. Ces deux events doivent etre coches sur
  // l'endpoint (dashboard Stripe > Developers > Webhooks). S'ils ne le sont
  // pas, un paiement differe est refuse ici et la confirmation n'arrive
  // jamais : le pro paie sans etre credite. D'ou l'incident plutot qu'un
  // simple log — ce chemin ne doit jamais passer inapercu tant qu'on n'a
  // pas verifie l'abonnement aux events.
  if (session.payment_status !== "paid") {
    await reportIncident("stripe.awaiting-async-payment", {
      context: {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        proProfileId: metadata.proProfileId,
        // Si aucun async_payment_succeeded ne suit dans les minutes qui
        // viennent, l'event n'est pas abonne cote Stripe : crediter a la
        // main et corriger la config.
        followUpEvent: "checkout.session.async_payment_succeeded",
      },
    });
    await logEvent(event);
    return new NextResponse("Awaiting payment", { status: 200 });
  }

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

  // Validation montant contre le pack canonique en BDD.
  // Protege contre manipulation du metadata, pack supprime entre Checkout
  // creation et webhook arrival, ou bug createCheckoutSession qui aurait
  // set un mauvais montant. Return 200 sans crediter sur discordance.
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

  // Symetrique du controle ci-dessus, cote encaisse : le credit accorde est
  // valide contre le pack, le montant PAYE ne l'etait pas. Sans ca, la
  // "defense en profondeur" annoncee ne couvrait qu'une moitie de
  // l'operation.
  //
  // Sauf conversion de devise : l'Adaptive Pricing est actif sur le compte,
  // et un acheteur hors zone euro voit `amount_total` libelle dans SA
  // devise avec `currency_conversion` renseigne. Comparer bêtement ferait
  // echouer un paiement legitime — et un refus ici est pire que le trou
  // qu'on bouche, puisque le pro aurait paye sans etre credite. On se
  // contente alors de tracer.
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
          // Montant réellement payé (hors bonus) + bonus, pour les
          // factures B2B (cf. /admin/finances). amountCents = total crédité.
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
      // Conflit unique sur stripeEventId → event deja traite (Stripe retry).
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
    // 500 → Stripe re-essaye automatiquement (retry exponential backoff).
    return new NextResponse("Internal error", { status: 500 });
  }

  // 5. Email APRES la transaction (fire-and-forget). Si email rate, on a
  //    tout de meme credite le wallet ; l'erreur Resend est loggee avec
  //    contexte complet par sendRechargeConfirmationEmail.
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

