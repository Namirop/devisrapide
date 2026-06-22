import { createHash } from "node:crypto";

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

// Password reset : 3 demandes / heure / IP. Anti-spam sur l'envoi d'emails
// de reinitialisation (eviter de matraquer la boite d'un pro / le quota
// Resend depuis une seule IP).
let _passwordResetLimiter: Limiter | null = null;
export function passwordResetLimiter(): Limiter {
  if (!_passwordResetLimiter) {
    _passwordResetLimiter = buildLimiter("rl:password-reset", 3, "1 h");
  }
  return _passwordResetLimiter;
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

// ─── Anti-spam création de demandes (Sprint D) ───────────────
// Limites multi-dimensions, en plus de l'IP horaire (createLeadLimiter,
// 5/h) déjà existante :
//   - email      : 1 / 10 min  +  3 / 24 h
//   - téléphone  : 1 / 10 min  +  3 / 24 h  (numéro normalisé)
//   - IP         : 5 / h (existant)  +  10 / 24 h
// Les identifiants email/téléphone sont HASHÉS (SHA-256) avant d'être
// utilisés comme clé Redis → aucune donnée perso en clair dans les compteurs.

let _clEmailShort: Limiter | null = null;
function clEmailShortLimiter(): Limiter {
  if (!_clEmailShort) _clEmailShort = buildLimiter("rl:cl-email-10m", 1, "10 m");
  return _clEmailShort;
}
let _clEmailDay: Limiter | null = null;
function clEmailDayLimiter(): Limiter {
  if (!_clEmailDay) _clEmailDay = buildLimiter("rl:cl-email-24h", 3, "24 h");
  return _clEmailDay;
}
let _clPhoneShort: Limiter | null = null;
function clPhoneShortLimiter(): Limiter {
  if (!_clPhoneShort) _clPhoneShort = buildLimiter("rl:cl-phone-10m", 1, "10 m");
  return _clPhoneShort;
}
let _clPhoneDay: Limiter | null = null;
function clPhoneDayLimiter(): Limiter {
  if (!_clPhoneDay) _clPhoneDay = buildLimiter("rl:cl-phone-24h", 3, "24 h");
  return _clPhoneDay;
}
let _clIpDay: Limiter | null = null;
function clIpDayLimiter(): Limiter {
  if (!_clIpDay) _clIpDay = buildLimiter("rl:cl-ip-24h", 10, "24 h");
  return _clIpDay;
}

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export type CreateLeadRateLimitOutcome =
  | { ok: true }
  | { ok: false; dimension: string };

/**
 * Vérifie toutes les limites anti-spam de création de demande. Court-circuite
 * à la première dimension dépassée et log le blocage (sans PII). Si Upstash
 * n'est pas configuré, chaque limiter est no-op → ok: true (cf. NOOP_LIMITER).
 */
export async function enforceCreateLeadRateLimits(input: {
  ip: string;
  email: string;
  phone: string;
}): Promise<CreateLeadRateLimitOutcome> {
  const emailKey = hashIdentifier(input.email.trim().toLowerCase());
  const phoneKey = hashIdentifier(normalizePhone(input.phone));

  // Fenêtres courtes d'abord (rafale), puis 24h, puis IP.
  const checks: Array<{ dim: string; limiter: Limiter; id: string }> = [
    { dim: "email:10m", limiter: clEmailShortLimiter(), id: emailKey },
    { dim: "phone:10m", limiter: clPhoneShortLimiter(), id: phoneKey },
    { dim: "email:24h", limiter: clEmailDayLimiter(), id: emailKey },
    { dim: "phone:24h", limiter: clPhoneDayLimiter(), id: phoneKey },
    { dim: "ip:1h", limiter: createLeadLimiter(), id: input.ip },
    { dim: "ip:24h", limiter: clIpDayLimiter(), id: input.ip },
  ];

  for (const c of checks) {
    const res = await c.limiter.limit(c.id);
    if (!res.success) {
      // Log pour repérer les patterns de spam (clé tronquée, pas de
      // PII en clair : email/tél sont déjà des hashs, IP tronquée).
      console.warn("[ratelimit] création de demande bloquée", {
        dimension: c.dim,
        key: c.id.slice(0, 12),
      });
      return { ok: false, dimension: c.dim };
    }
  }
  return { ok: true };
}
