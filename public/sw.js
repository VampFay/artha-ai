/**
 * Service Worker — minimal pass-through.
 * Does NOT cache anything. All requests go to network.
 * This prevents the "sw.js: Not found" error.
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through: all requests go to network, no caching
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
