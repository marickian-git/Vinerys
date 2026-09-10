const CACHE = 'vinerys-v1';
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const withBase = (path) => `${BASE_PATH}${path}` || '/';
const OFFLINE_URL = withBase('/offline');

const STATIC_ASSETS = [
  withBase('/'),
  withBase('/dashboard'),
  withBase('/wines'),
  withBase('/offline'),
  withBase('/manifest.webmanifest'),
  withBase('/icons/icon-192.png'),
  withBase('/icons/icon-512.png'),
];

// Install — cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // API requests — network only, no cache
  if (url.pathname.startsWith(`${BASE_PATH}/api/`)) return;

  // Navigation requests — network first, fallback offline page
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(OFFLINE_URL) || caches.match('/')
      )
    );
    return;
  }

  // Static assets — cache first
  if (
    url.pathname.startsWith(`${BASE_PATH}/icons/`) ||
    url.pathname.startsWith(`${BASE_PATH}/_next/static/`)
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => cached ||
        fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Everything else — network first
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});