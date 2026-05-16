"use client";

import { useEffect } from "react";

/**
 * Enregistre /sw.js au mount. Composant client null-render.
 *
 * Strategie d'update simple V1 : laisser le SW gerer lui-meme via
 * skipWaiting + clients.claim (cf. public/sw.js). Pas de prompt
 * utilisateur "nouvelle version dispo, rechargez" — overkill au MVP.
 *
 * Idempotent : navigator.serviceWorker.register dedupe sur le meme
 * scope/url, donc remonter le composant ne re-enregistre pas.
 *
 * Production-only par defaut. En dev, un SW actif peut interferer avec
 * le HMR Next (cache stale, redirections offline accidentelles). Pour
 * tester le SW en local : set NEXT_PUBLIC_SW_DEV=1.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_SW_DEV !== "1"
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.error("[pwa] service worker registration failed", err);
      });
  }, []);

  return null;
}
