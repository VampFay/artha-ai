/**
 * KILLER SERVICE WORKER — unregisters all old SWs and deletes all caches.
 * This breaks the cache cycle: old SW (v1) → old HTML → old layout → old SW...
 *
 * After this runs, the browser will fetch fresh HTML, which registers
 * the real SW (see layout.tsx).
 */

// Install immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate immediately: delete ALL caches, unregister self, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Delete ALL caches
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k)))
      ),
      // Unregister this service worker
      self.registration.unregister(),
      // Take control of all clients
      self.clients.claim(),
    ]).then(() => {
      console.log("[SW] Killer SW: all caches deleted, self unregistered");
    })
  );
});

// NO fetch handler — let ALL requests go to the network.
// This ensures the browser fetches fresh HTML/JS from the server.
