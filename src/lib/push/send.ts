import * as Sentry from "@sentry/nextjs";
import webpush from "web-push";

import { prisma } from "@/lib/prisma";

/**
 * Envoi de push notifications cote serveur — fire-and-forget par contrat.
 *
 * Resilience :
 * - Si VAPID keys absentes (dev sans config) → no-op silencieux.
 * - Si l'envoi echoue pour 1 subscription (navigateur down, push service
 *   indispo) → log + Sentry, on continue sur les autres devices du pro.
 * - Si une subscription retourne 410 Gone ou 404 Not Found (navigateur a
 *   revoque la subscription) → suppression auto de la PushSubscription
 *   en BDD (cleanup).
 * - JAMAIS de throw vers l'appelant. Un push raté ne doit pas faire
 *   echouer l'action metier (creation lead, debit wallet, etc.).
 *
 * Master-switch ProProfile.notifyByPush respecte centralement ici. Si
 * notifyByPush=false → no-op, peu importe les subscriptions enregistrees
 * (le pro garde ses subscriptions pour reactivation rapide sans
 * re-prompter le navigateur).
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:contact@devisrapide.fr";

const vapidConfigured = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);

if (vapidConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!);
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  /** Optionnel : groupe les notifs sous le meme tag (replace au lieu de stack). */
  tag?: string;
};

/**
 * Envoi d'un push a toutes les subscriptions actives d'un pro.
 *
 * @returns {Promise<{ sent: number; failed: number; cleaned: number }>}
 *   Fire-and-forget : la promesse resoud meme en cas d'erreur, jamais throw.
 *   Le retour est utile pour les tests / debugging uniquement.
 */
export async function sendPushToProfile(
  proProfileId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number; cleaned: number }> {
  const result = { sent: 0, failed: 0, cleaned: 0 };

  if (!vapidConfigured) {
    return result;
  }

  try {
    const profile = await prisma.proProfile.findUnique({
      where: { id: proProfileId },
      select: {
        notifyByPush: true,
        pushSubscriptions: {
          select: {
            id: true,
            endpoint: true,
            p256dh: true,
            auth: true,
          },
        },
      },
    });

    if (!profile || !profile.notifyByPush) return result;
    if (profile.pushSubscriptions.length === 0) return result;

    const body = JSON.stringify(payload);
    const deadSubIds: string[] = [];
    const usedSubIds: string[] = [];

    await Promise.all(
      profile.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
          result.sent++;
          usedSubIds.push(sub.id);
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            deadSubIds.push(sub.id);
          } else {
            result.failed++;
            console.error("[push] sendNotification failed", {
              proProfileId,
              endpoint: sub.endpoint.slice(0, 60),
              statusCode,
              error: err instanceof Error ? err.message : String(err),
            });
            Sentry.captureException(err, {
              tags: { area: "push", statusCode: String(statusCode ?? "unknown") },
              extra: { proProfileId },
            });
          }
        }
      }),
    );

    if (deadSubIds.length > 0) {
      await prisma.pushSubscription
        .deleteMany({ where: { id: { in: deadSubIds } } })
        .then(({ count }) => {
          result.cleaned = count;
        })
        .catch((err) => {
          console.error("[push] dead subscription cleanup failed", { err });
        });
    }

    if (usedSubIds.length > 0) {
      await prisma.pushSubscription
        .updateMany({
          where: { id: { in: usedSubIds } },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {
          // Update lastUsedAt n'est pas critique, swallow.
        });
    }
  } catch (err) {
    // Filet de securite ultime : toute erreur (BDD down, etc.) doit
    // rester silencieuse pour respecter le contrat fire-and-forget.
    console.error("[push] sendPushToProfile failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
    Sentry.captureException(err, {
      tags: { area: "push", step: "outer" },
      extra: { proProfileId },
    });
  }

  return result;
}
