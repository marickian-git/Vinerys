const CACHE = 'vinerys-v1';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/wines',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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
  if (url.pathname.startsWith('/api/')) return;

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
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/')
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