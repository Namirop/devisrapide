import webpush from "web-push";

import { prisma } from "@/lib/prisma";

/**
 * Push web côté serveur, fire-and-forget : ne lève jamais, un push raté ne
 * doit pas faire échouer l'action métier. Sans clés VAPID : no-op.
 *
 * Un échec sur un appareil est loggé sans alerte (événement ordinaire) ; une
 * subscription révoquée (404/410) est supprimée. `notifyByPush=false` coupe
 * l'envoi sans supprimer les subscriptions, pour réactiver sans redemander
 * la permission au navigateur.
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ?? "mailto:contact@devisrapide.be";

const vapidConfigured = Boolean(VAPID_PUBLIC && VAPID_PRIVATE);

if (vapidConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC!, VAPID_PRIVATE!);
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  /** Même tag = la notification remplace la précédente au lieu de s'empiler. */
  tag?: string;
};

/** Envoie à tous les appareils d'un pro. Les compteurs servent au diagnostic. */
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
          // lastUsedAt n'est pas critique : erreur ignorée.
        });
    }
  } catch (err) {
    // Filet final (BDD indisponible…) : contrat fire-and-forget.
    console.error("[push] sendPushToProfile failed", {
      proProfileId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return result;
}
