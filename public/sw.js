/* Service worker DevisRapide : coquille PWA minimale + notifications push.
 *
 * Aucune donnée métier en cache (leads et wallet doivent rester frais) :
 * seuls offline.html, le logo, les icônes et le manifest sont pré-cachés,
 * offline.html servant de repli aux navigations hors ligne. Pas de build : JavaScript
 * vanilla exécuté tel quel par les navigateurs modernes.
 */

// À incrémenter à chaque modification d'un asset pré-caché : le cache est
// indexé par cette constante, pas par le contenu, et une installation
// existante continuerait sinon de servir l'ancienne version.
const CACHE_VERSION = "devisrapide-v3";
const APP_SHELL = [
  "/offline.html",
  "/logo/logo.png",
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

// Seules les navigations sont interceptées (réseau, puis repli offline.html) ;
// API, Server Actions et assets vont directement au réseau.
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

// Payload JSON { title, body, url, tag? } envoyé par src/lib/push/send.ts.
// showNotification n'interprète pas de HTML : pas de surface XSS ici.
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

// Clic : ouvre l'URL portée par le push (détail du lead, wallet…).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Une fenêtre déjà sur l'URL cible reprend simplement le focus.
      for (const client of clientsArr) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // openWindow plutôt que WindowClient.navigate() : en PWA iOS standalone,
      // navigate() est ignoré et l'app resterait sur start_url.
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })(),
  );
});
