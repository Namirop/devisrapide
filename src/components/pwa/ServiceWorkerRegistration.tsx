"use client";

import { useEffect } from "react";

/**
 * Enregistre /sw.js au montage (idempotent : register déduplique par
 * scope/URL). Mise à jour gérée par le SW lui-même (skipWaiting +
 * clients.claim), sans invite de rechargement.
 *
 * Production uniquement : en dev, un SW actif perturbe le HMR (cache périmé,
 * page hors ligne). NEXT_PUBLIC_SW_DEV=1 l'active en local.
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
