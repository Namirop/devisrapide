import createBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

// Bundle analyzer : `ANALYZE=true` au build génère .next/analyze/*.html,
// sans effet sur un build normal.
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

// CSP : défense en profondeur (XSS, clickjacking, exfiltration).
// - script-src 'unsafe-inline' : scripts d'hydratation injectés par Next ;
//   'unsafe-eval' : requis par le runtime de développement (HMR).
// - style-src 'unsafe-inline' : styles inline injectés au rendu serveur.
// Une CSP à nonce supprimerait les unsafe-* mais impose un nonce par requête
// dans le proxy, propagé aux composants : compromis assumé.
// Hôtes tiers : Cloudflare Turnstile (challenges.cloudflare.com) et Stripe.
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
  // Service worker de la PWA (/sw.js).
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
