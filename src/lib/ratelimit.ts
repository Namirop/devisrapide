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

// Login : 5 tentatives / minute / IP. Throttle defensif anti brute force.
// Bcrypt cost 12 limite deja le rate cote CPU (~250ms/check) mais on
// ajoute la barriere IP pour bloquer un scan automatise.
let _loginLimiter: Limiter | null = null;
export function loginLimiter(): Limiter {
  if (!_loginLimiter) {
    _loginLimiter = buildLimiter("rl:login", 5, "1 m");
  }
  return _loginLimiter;
}

// Pro-signup : 3 inscriptions / heure / IP. Bloque spam de creation
// de comptes pros (qui passent en file d'attente admin = polluerait le
// panel /admin/professionnels).
let _proSignupLimiter: Limiter | null = null;
export function proSignupLimiter(): Limiter {
  if (!_proSignupLimiter) {
    _proSignupLimiter = buildLimiter("rl:pro-signup", 3, "1 h");
  }
  return _proSignupLimiter;
}

// Wallet checkout : 10 sessions Stripe / heure / proProfileId. Evite
// les creations de sessions Stripe en boucle (mauvaise interaction UI,
// bug client, ou attaque visant a faire grossir les Stripe events
// pour brouiller les retries).
let _walletCheckoutLimiter: Limiter | null = null;
export function walletCheckoutLimiter(): Limiter {
  if (!_walletCheckoutLimiter) {
    _walletCheckoutLimiter = buildLimiter("rl:wallet-checkout", 10, "1 h");
  }
  return _walletCheckoutLimiter;
}
