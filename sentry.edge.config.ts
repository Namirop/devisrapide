// Sentry edge SDK init — capture cote middleware (src/proxy.ts) et
// Route Handlers Edge runtime.

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
