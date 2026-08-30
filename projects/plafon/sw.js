const CACHE_NAME = "plafon-v2";
const STATIC_ASSETS = ["/", "/dashboard/github/", "/dashboard/vpn/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle http/https requests (skip chrome-extension://, etc)
  if (!request.url.startsWith("http")) return;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Never cache auth endpoints
  if (request.url.includes("/auth/")) return;

  // API requests: network-only (don't cache authenticated responses)
  if (request.url.includes("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
