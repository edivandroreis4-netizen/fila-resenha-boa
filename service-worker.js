const CACHE_NAME = "fila-resenha-boa-busca-global-presenca-v1";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/supabase-config.js",
  "./js/supabase-sync.js",
  "./manifest.json",
  "./assets/images/logo-resenha-boa.jpg",
  "./assets/images/edivandro-lima.jpg",
  "./assets/images/professional-placeholder.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then(networkResponse => {
          if (event.request.url.startsWith(self.location.origin)) {
            const clone = networkResponse.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }

          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
