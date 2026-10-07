// Service worker minimal și sigur (momentan nu e înregistrat — vezi ServiceWorkerRegister / PWA-001).
// Regulă: NU se cachează pagini sau răspunsuri API (conțin date private). Doar asset-uri statice + pagina offline.
const CACHE = 'vinerys-static-v2';
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const withBase = (path) => `${BASE_PATH}${path}`;
const OFFLINE_URL = withBase('/offline');
const PRECACHE = [OFFLINE_URL, withBase('/icons/icon-192.png'), withBase('/icons/icon-512.png')];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Navigare: mereu rețea; fără rețea → pagina offline (nu o versiune cache-uită a paginii private)
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Asset-uri statice versionate: cache-first
  if (url.pathname.startsWith(withBase('/_next/static/')) || url.pathname.startsWith(withBase('/icons/'))) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })),
    );
  }
  // Restul (API, media, pagini): fără interceptare
});
