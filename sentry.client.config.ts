// Sentry client SDK init — capture cote browser.
//
// Gracefully no-op si NEXT_PUBLIC_SENTRY_DSN est absent : Sentry.init
// avec dsn vide ne fait rien (pas de network, pas d'erreur). Permet
// au dev sans compte Sentry de continuer normalement.
//
// `enabled: production only` — pas de capture en dev pour ne pas polluer
// le projet Sentry avec les erreurs locales (HMR, dev tools, etc.).

import * as Sentry from "@sentry/nextjs";

import { sentryBeforeSend } from "@/lib/sentry/before-send";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  beforeSend: sentryBeforeSend,
});
