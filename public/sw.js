const CACHE = 'secondyouth-shell-__BUILD_ID__';
const SHELL = ['/', '/icon.svg', '/manifest.webmanifest', /* __BUILD_ASSETS__ */];
const STATIC_PATHS = new Set(SHELL.slice(1));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map((path) => new Request(path, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key === 'secondyouth-v2' || (key.startsWith('secondyouth-shell-') && key !== CACHE))
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' && ['/', '/index.html'].includes(url.pathname)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match('/')) || Response.error();
    }));
  } else if (STATIC_PATHS.has(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(url.pathname)) || fetch(request)));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const dashboard = windows.find((client) => {
      const url = new URL(client.url);
      return url.origin === self.location.origin && ['/', '/index.html'].includes(url.pathname);
    });
    if (dashboard) {
      await dashboard.navigate('/#/medicines');
      return dashboard.focus();
    }
    return self.clients.openWindow('/#/medicines');
  })());
});
