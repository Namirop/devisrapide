// Sentry server SDK init — capture cote Server Components, Server Actions,
// Route Handlers (Node runtime).
//
// `enabled: production only` — voir client config.

import * as Sentry from "@sentry/nextjs";

import { sentryBeforeSend } from "@/lib/sentry/before-send";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  beforeSend: sentryBeforeSend,
});
