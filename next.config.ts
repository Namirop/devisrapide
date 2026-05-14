import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// CSP (Content-Security-Policy) — defense en profondeur contre XSS,
// clickjacking, exfiltration de donnees, etc.
//
// 'unsafe-eval' : necessaire pour Next.js runtime (HMR en dev, bundle
//   chunks dynamiques en prod). Sans ca, Next casse au boot.
// 'unsafe-inline' (script-src) : necessaire pour les scripts inline
//   injectes par Next (hydration scripts, layout state, etc.). Sans ca,
//   les pages SSR ne s'hydratent pas.
// 'unsafe-inline' (style-src) : necessaire pour styled-jsx + les styles
//   inline runtime de Next.js (next/font notamment).
//
// Migration vers nonce-based CSP (suppression des unsafe-*) tracked
// dans docs/v2-roadmap.md section "Securite V2". Complexe (nonce
// middleware + propagation composants) — V1 accepte le tradeoff
// pour shipping rapide.
//
// Allowlist hosts :
//   - https://challenges.cloudflare.com : Cloudflare Turnstile
//   - https://js.stripe.com : Stripe Checkout JS
//   - https://hooks.stripe.com : Stripe Checkout iframe
//   - https://api.stripe.com : Stripe Checkout API
//   - https://browser.sentry-cdn.com : Sentry browser SDK CDN
//   - https://*.sentry.io / https://*.ingest.sentry.io : Sentry telemetry
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://browser.sentry-cdn.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.sentry.io",
  "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

// Wrap avec Sentry pour upload des source maps + tunneling. Si
// SENTRY_AUTH_TOKEN absent, withSentryConfig est gracefully no-op pour
// le upload (les captures runtime continuent de fonctionner via le SDK).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: process.env.NODE_ENV !== "production",
  telemetry: false,
});
