// Next.js instrumentation hook (boot serveur). Charge le bon Sentry
// config selon le runtime (Node ou Edge). Voir
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
