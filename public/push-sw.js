// Service worker DOAR pentru notificări push (CELLAR-007): fără fetch, fără cache.
// Separat de sw.js (care e dezînregistrat intenționat până la PWA-001).
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; }
  const scope = new URL(self.registration.scope).pathname.replace(/\/$/, '');
  event.waitUntil(self.registration.showNotification(data.title || 'Vinerys', {
    body: data.body || '',
    icon: `${scope}/icons/icon-192.png`,
    badge: `${scope}/icons/icon-192.png`,
    data: { url: data.url || `${scope}/` },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const open = windows.find((w) => w.url === url);
    return open ? open.focus() : self.clients.openWindow(url);
  }));
});
