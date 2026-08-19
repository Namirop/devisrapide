import { Redis } from "@upstash/redis";

/**
 * Client Upstash partage (rate limiting + compteur de quota email).
 *
 * Retourne `null` si les deux variables d'env ne sont pas posees : chaque
 * appelant decide alors de son fallback (no-op pour le rate limit,
 * comptage abandonne pour le quota). Upstash est en HTTP, donc pas de
 * connexion a maintenir — l'instance n'est memoisee que pour eviter de la
 * reconstruire a chaque appel.
 */
let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (_redis) return _redis;
  _redis = new Redis({ url, token });
  return _redis;
}
