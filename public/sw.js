/**
 * Service Worker — offline-first caching for Artha AI.
 * Strategy:
 *   - HTML pages: network-first (always fetch latest, fall back to cache)
 *   - Static assets (_next/static): cache-first (immutable, safe to cache)
 *   - API: stale-while-revalidate
 *   - Auth API: never cache
 *
 * IMPORTANT: HTML pages must NOT be cached cache-first, otherwise users
 * will see stale HTML after updates (e.g., portal toggle not appearing).
 */

const CACHE_VERSION = "artha-ai-v3"; // bumped from v1 → v3 to invalidate old cache
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(["/manifest.json"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (Google Fonts, etc.)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip API auth requests (don't cache tokens)
  if (url.pathname.startsWith("/api/auth/")) return;

  // For API requests: stale-while-revalidate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // For static assets (_next/static, images, fonts): cache-first
  // These are content-hashed and safe to cache aggressively.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // For HTML pages (including "/"): network-first
  // Always try to fetch the latest HTML from the server.
  // Only fall back to cache if the network fails (offline mode).
  if (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest HTML for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network failed — fall back to cached HTML
          return caches.match(request).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
