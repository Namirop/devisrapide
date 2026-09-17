import { getRedis } from "@/lib/redis";

// Compteur d'envois quotidiens : au-delà du plafond journalier de l'offre
// gratuite Resend, les envois sont refusés sans que rien ne le signale. Le
// volume croît avec le nombre de pros notifiés, pas avec celui des demandes.

export const RESEND_FREE_DAILY_LIMIT = 100;

/** 60 % du plafond : alerte assez tôt pour réagir sans perdre d'email. */
export const QUOTA_WARNING_THRESHOLD = 60;

/** Trois jours : de quoi relire le compteur d'hier sans rien accumuler. */
const KEY_TTL_SECONDS = 3 * 24 * 60 * 60;

export type EmailQuotaOutcome = {
  total: number;
  /** Vrai uniquement pour l'appel qui fait passer le seuil. */
  crossedWarning: boolean;
};

// Journée UTC (et non Europe/Brussels) : remise à zéro alignée sur Resend.
function dayKey(now: Date): string {
  return `email:sent:${now.toISOString().slice(0, 10)}`;
}

/**
 * Incrémente le compteur du jour et indique si le seuil vient d'être franchi.
 * Retourne `null` sans Upstash (dev, CI) : l'envoi ne dépend jamais du compteur.
 */
export async function recordEmailsSent(
  recipients: number,
): Promise<EmailQuotaOutcome | null> {
  const redis = getRedis();
  if (!redis || recipients <= 0) return null;

  const key = dayKey(new Date());
  const total = await redis.incrby(key, recipients);
  // Clé tout juste créée : on pose le TTL une seule fois (INCRBY le conserve).
  if (total === recipients) {
    await redis.expire(key, KEY_TTL_SECONDS);
  }

  return {
    total,
    // INCRBY est atomique : un seul appel voit le seuil franchi, donc une
    // seule alerte par jour, sans verrou.
    crossedWarning:
      total >= QUOTA_WARNING_THRESHOLD &&
      total - recipients < QUOTA_WARNING_THRESHOLD,
  };
}
