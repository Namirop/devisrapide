import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RatelimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type Limiter = {
  limit: (identifier: string) => Promise<RatelimitResult>;
};

const NOOP_LIMITER: Limiter = {
  limit: async () => ({
    success: true,
    limit: Number.POSITIVE_INFINITY,
    remaining: Number.POSITIVE_INFINITY,
    reset: 0,
  }),
};

let _redis: Redis | null = null;
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (_redis) return _redis;
  _redis = new Redis({ url, token });
  return _redis;
}

function buildLimiter(prefix: string, requests: number, window: string): Limiter {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        `[ratelimit] Upstash non configuré (prefix=${prefix}) → fallback no-op.`,
      );
    }
    return NOOP_LIMITER;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      requests,
      window as Parameters<typeof Ratelimit.slidingWindow>[1],
    ),
    prefix,
    analytics: false,
  });
}

let _createLeadLimiter: Limiter | null = null;
export function createLeadLimiter(): Limiter {
  if (!_createLeadLimiter) {
    _createLeadLimiter = buildLimiter("rl:create-lead", 5, "1 h");
  }
  return _createLeadLimiter;
}
