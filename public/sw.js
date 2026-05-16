/* DevisRapide service worker — minimal PWA shell + push notifications.
 *
 * Strategie volontairement minimale : pas de cache offline complet des
 * donnees (les leads/wallet doivent toujours etre frais). On pre-cache
 * uniquement la page offline.html + le logo + le manifest, et on sert
 * offline.html en fallback navigation quand le reseau est down.
 *
 * Note : pas de build step. Code vanilla ES2020+ executable directement
 * par les navigateurs modernes (cibles : Chrome/Edge/Firefox/Safari iOS 16+).
 */

const CACHE_VERSION = "devisrapide-v1";
const APP_SHELL = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Fetch : network-first avec fallback offline.html UNIQUEMENT sur les
// navigations (mode === "navigate"). Tout le reste (API, Server Actions,
// images, _next/static, etc.) passe direct au reseau sans interception
// — pas de stale data servie au pro.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;
  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_VERSION);
      const fallback = await cache.match("/offline.html");
      return fallback ?? Response.error();
    }),
  );
});

// Push : payload JSON envoye par lib/push/send.ts cote serveur.
// Format attendu : { title, body, url, tag? }. Tout est dejà sanitize
// cote serveur (le SW est isole du DOM, pas de XSS possible ici).
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "DevisRapide", body: event.data.text(), url: "/dashboard" };
  }
  const { title, body, url, tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title ?? "DevisRapide", {
      body: body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: url ?? "/dashboard" },
      tag,
    }),
  );
});

// Notificationclick : focus une fenetre DevisRapide existante OU ouvre
// une nouvelle fenetre sur l'URL du push. Gestion multi-tabs : on prefere
// reutiliser une fenetre existante pour eviter de spammer les tabs du pro.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientsArr) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clientsArr.length > 0 && "focus" in clientsArr[0]) {
        await clientsArr[0].navigate(url).catch(() => {});
        return clientsArr[0].focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })(),
  );
});
