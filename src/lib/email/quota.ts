import { getRedis } from "@/lib/redis";

// Compteur d'envois quotidiens — filet contre le plafond Resend.
//
// Ce n'est pas le quota mensuel (3 000) qui saute en premier, c'est la
// limite de 100 envois par JOUR de l'offre gratuite. Et elle ne monte pas
// avec le nombre de demandes mais avec le nombre de pros : une demande
// declenche un email au client, un a chaque pro notifie, un a chaque pro
// qui l'achete. Huit pros inscrits sur la categorie = une dizaine
// d'envois pour une seule demande.
//
// Au depassement, Resend refuse simplement les envois suivants : le site
// tourne, mais les pros ne sont plus prevenus de leurs leads et rien ne
// le signale. D'ou ce compteur, qui alerte pendant qu'il est encore temps
// de basculer sur l'offre payante.

/** Plafond quotidien de l'offre gratuite Resend. */
export const RESEND_FREE_DAILY_LIMIT = 100;

/**
 * Seuil d'alerte, a 60 % du plafond. Assez tot pour avoir le temps de
 * basculer sans perdre un seul email, assez haut pour ne pas alerter sur
 * une journee ordinaire.
 */
export const QUOTA_WARNING_THRESHOLD = 60;

/** Trois jours : de quoi relire le compteur d'hier sans rien accumuler. */
const KEY_TTL_SECONDS = 3 * 24 * 60 * 60;

export type EmailQuotaOutcome = {
  /** Total d'envois comptes pour la journee en cours. */
  total: number;
  /** Vrai uniquement pour l'appel qui fait passer le seuil. */
  crossedWarning: boolean;
};

/**
 * Journee UTC, volontairement — et non Europe/Brussels comme le reste de
 * l'app. Ce compteur n'a de sens que s'il se remet a zero en meme temps
 * que celui de Resend, c'est le decompte du fournisseur qui fait foi.
 */
function dayKey(now: Date): string {
  return `email:sent:${now.toISOString().slice(0, 10)}`;
}

/**
 * Incremente le compteur du jour et indique si le seuil vient d'etre
 * franchi.
 *
 * Retourne `null` si Upstash n'est pas configure (dev local, CI) : pas de
 * comptage, pas d'alerte, et surtout pas d'erreur — l'envoi d'email ne
 * doit jamais dependre de la disponibilite du compteur.
 */
export async function recordEmailsSent(
  recipients: number,
): Promise<EmailQuotaOutcome | null> {
  const redis = getRedis();
  if (!redis || recipients <= 0) return null;

  const key = dayKey(new Date());
  const total = await redis.incrby(key, recipients);
  // Premiere ecriture de la journee : la cle vient d'etre creee, on lui
  // pose sa duree de vie. Un INCRBY sur une cle existante ne touche pas
  // au TTL, donc ce n'est fait qu'une fois.
  if (total === recipients) {
    await redis.expire(key, KEY_TTL_SECONDS);
  }

  return {
    total,
    // INCRBY est atomique : un seul appel peut voir le compteur passer
    // d'en dessous du seuil a au-dessus. L'alerte part donc exactement
    // une fois par jour, sans verrou supplementaire.
    crossedWarning:
      total >= QUOTA_WARNING_THRESHOLD &&
      total - recipients < QUOTA_WARNING_THRESHOLD,
  };
}
