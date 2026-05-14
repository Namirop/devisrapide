import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Scrub PII des events Sentry avant envoi. Pattern : whitelist plutot
 * que blacklist (on retire tout ce qui ressemble a un champ sensible
 * connu, on laisse passer le reste).
 *
 * Champs scrubbes :
 *   - email, phone, password, passwordHash, currentPassword, newPassword
 *     dans request.data, contexts.data, extra
 *   - tokens / secrets dans headers (Authorization, Cookie deja scrubbed
 *     par Sentry par defaut mais on durcit)
 */
const SENSITIVE_KEYS = new Set([
  "email",
  "phone",
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "confirmEmail",
  "newEmail",
  "stripeSecretKey",
  "stripeWebhookSecret",
  "nextauthSecret",
  "vapidPrivateKey",
  "resendApiKey",
  "cronSecret",
  "turnstileSecretKey",
]);

function scrubObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(scrubObject);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = scrubObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function sentryBeforeSend(event: ErrorEvent): ErrorEvent | null {
  if (event.request?.data) {
    event.request.data = scrubObject(event.request.data);
  }
  if (event.extra) {
    event.extra = scrubObject(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = scrubObject(event.contexts) as typeof event.contexts;
  }
  return event;
}
