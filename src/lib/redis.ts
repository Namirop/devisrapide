import { Redis } from "@upstash/redis";

// Client Upstash partagé (rate limit, quota email). `null` sans configuration :
// chaque appelant choisit son repli.
let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (_redis) return _redis;
  _redis = new Redis({ url, token });
  return _redis;
}
