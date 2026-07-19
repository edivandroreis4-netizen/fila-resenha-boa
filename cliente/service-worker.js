const CACHE_NAME = "resenha-cliente-expediente-posicao-cancelamento-v4";
const ASSETS = ["./","./index.html","./css/style.css","./js/app.js","./manifest.json","../js/supabase-config.js","../assets/images/logo-resenha-boa.jpg","../assets/images/edivandro-lima.jpg","../assets/icons/icon-192.png","../assets/icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => { if (e.request.method !== "GET") return; e.respondWith(fetch(e.request).then(r => { if (e.request.url.startsWith(self.location.origin)) caches.open(CACHE_NAME).then(c => c.put(e.request,r.clone())); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))); });
