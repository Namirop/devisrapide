import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/lib/redis";

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

function buildLimiter(
  prefix: string,
  requests: number,
  window: string,
): Limiter {
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

// Connexion : 5 tentatives / min / IP. bcrypt ralentit déjà chaque essai ;
// la limite par IP coupe court au brute force automatisé.
let _loginLimiter: Limiter | null = null;
export function loginLimiter(): Limiter {
  if (!_loginLimiter) {
    _loginLimiter = buildLimiter("rl:login", 5, "1 m");
  }
  return _loginLimiter;
}

// Inscription pro : 3 / h / IP. Chaque compte entre dans la file de
// validation admin : un spam la saturerait.
let _proSignupLimiter: Limiter | null = null;
export function proSignupLimiter(): Limiter {
  if (!_proSignupLimiter) {
    _proSignupLimiter = buildLimiter("rl:pro-signup", 3, "1 h");
  }
  return _proSignupLimiter;
}

// Mot de passe oublié : 3 / h / IP. Protège la boîte du pro et le quota
// d'envoi d'emails.
let _passwordResetLimiter: Limiter | null = null;
export function passwordResetLimiter(): Limiter {
  if (!_passwordResetLimiter) {
    _passwordResetLimiter = buildLimiter("rl:password-reset", 3, "1 h");
  }
  return _passwordResetLimiter;
}

// Pré-contrôle email + TVA du wizard pro : 20 / 10 min / IP. Assez large
// pour corriger une faute de frappe, mais bloque l'énumération des comptes
// pros existants.
let _proSignupIdentityLimiter: Limiter | null = null;
export function proSignupIdentityLimiter(): Limiter {
  if (!_proSignupIdentityLimiter) {
    _proSignupIdentityLimiter = buildLimiter(
      "rl:pro-signup-identity",
      20,
      "10 m",
    );
  }
  return _proSignupIdentityLimiter;
}

// Recharge wallet : 10 sessions Stripe Checkout / h / proProfileId, contre
// les créations de sessions en boucle.
let _walletCheckoutLimiter: Limiter | null = null;
export function walletCheckoutLimiter(): Limiter {
  if (!_walletCheckoutLimiter) {
    _walletCheckoutLimiter = buildLimiter("rl:wallet-checkout", 10, "1 h");
  }
  return _walletCheckoutLimiter;
}

// ─── Anti-spam création de demandes ──────────────────────────
//   - email      : 1 / 10 min  +  3 / 24 h
//   - téléphone  : 1 / 10 min  +  3 / 24 h  (numéro normalisé)
//   - IP         : 5 / h (createLeadLimiter)  +  10 / 24 h
// Email et téléphone sont hachés (SHA-256) avant de servir de clé Redis :
// aucune coordonnée en clair dans les compteurs.

let _clEmailShort: Limiter | null = null;
function clEmailShortLimiter(): Limiter {
  if (!_clEmailShort)
    _clEmailShort = buildLimiter("rl:cl-email-10m", 1, "10 m");
  return _clEmailShort;
}
let _clEmailDay: Limiter | null = null;
function clEmailDayLimiter(): Limiter {
  if (!_clEmailDay) _clEmailDay = buildLimiter("rl:cl-email-24h", 3, "24 h");
  return _clEmailDay;
}
let _clPhoneShort: Limiter | null = null;
function clPhoneShortLimiter(): Limiter {
  if (!_clPhoneShort)
    _clPhoneShort = buildLimiter("rl:cl-phone-10m", 1, "10 m");
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
  { ok: true } | { ok: false; dimension: string };

// Upstash passe par HTTP : une réponse lente bloquerait toute la Server
// Action createLead. Chaque contrôle est borné à 3 s, en fail-open : mieux
// vaut laisser passer une demande légitime que bloquer le tunnel, l'anti-spam
// n'étant qu'une protection additionnelle.
const RATE_LIMIT_CHECK_TIMEOUT_MS = 3000;
const FAIL_OPEN_RESULT: RatelimitResult = {
  success: true,
  limit: Number.POSITIVE_INFINITY,
  remaining: Number.POSITIVE_INFINITY,
  reset: 0,
};

function withTimeout(
  promise: Promise<RatelimitResult>,
): Promise<RatelimitResult> {
  return Promise.race([
    promise,
    new Promise<RatelimitResult>((resolve) =>
      setTimeout(() => resolve(FAIL_OPEN_RESULT), RATE_LIMIT_CHECK_TIMEOUT_MS),
    ),
  ]);
}

/**
 * Vérifie en parallèle les 6 limites anti-spam de création de demande ; la
 * première dimension dépassée fait échouer l'ensemble. Sans Upstash configuré
 * ou en cas de timeout, le résultat est `ok: true` (fail-open).
 */
export async function enforceCreateLeadRateLimits(input: {
  ip: string;
  email: string;
  phone: string;
}): Promise<CreateLeadRateLimitOutcome> {
  const emailKey = hashIdentifier(input.email.trim().toLowerCase());
  const phoneKey = hashIdentifier(normalizePhone(input.phone));

  const checks: Array<{ dim: string; limiter: Limiter; id: string }> = [
    { dim: "email:10m", limiter: clEmailShortLimiter(), id: emailKey },
    { dim: "phone:10m", limiter: clPhoneShortLimiter(), id: phoneKey },
    { dim: "email:24h", limiter: clEmailDayLimiter(), id: emailKey },
    { dim: "phone:24h", limiter: clPhoneDayLimiter(), id: phoneKey },
    { dim: "ip:1h", limiter: createLeadLimiter(), id: input.ip },
    { dim: "ip:24h", limiter: clIpDayLimiter(), id: input.ip },
  ];

  const results = await Promise.all(
    checks.map((c) => withTimeout(c.limiter.limit(c.id))),
  );

  for (let i = 0; i < checks.length; i++) {
    const res = results[i];
    if (!res.success) {
      const c = checks[i];
      // Clé tronquée à 12 caractères : email et téléphone sont déjà hachés,
      // l'IP n'est que tronquée.
      console.warn("[ratelimit] création de demande bloquée", {
        dimension: c.dim,
        key: c.id.slice(0, 12),
      });
      return { ok: false, dimension: c.dim };
    }
  }
  return { ok: true };
}
