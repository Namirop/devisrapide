import createBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Bundle analyzer : active via ANALYZE=true a la commande build pour
// produire .next/analyze/*.html (client + edge + nodejs). Outil
// d'audit ponctuel, no-op en build normal.
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

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
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // worker-src 'self' : autorise l'enregistrement du service worker
  // /sw.js (PWA Sprint 5.5). Sans ca, certains navigateurs strict
  // (Firefox) refusent meme avec default-src 'self' en fallback.
  "worker-src 'self'",
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

export default withBundleAnalyzer(nextConfig);
