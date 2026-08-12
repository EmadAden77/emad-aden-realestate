const VERSION = 'emad-realestate-v11';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/404.html';
const PRECACHE = [
  '/', '/index.html', '/app.html', OFFLINE_URL, '/manifest.json', '/IMG_5.jpg',
  '/assets/css/home.bundle.css', '/assets/css/articles.css', '/assets/css/luxury-header.css?v=20260812-1',
  '/assets/js/luxury-home.js?v=20260812-2', '/assets/js/articles.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('emad-realestate-') && ![STATIC_CACHE, PAGE_CACHE].includes(key))
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    const cachedResponse = caches.match(request, { ignoreSearch: true });
    const networkResponse = fetch(request).then(async response => {
      if (response.ok) {
        const cache = await caches.open(PAGE_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    });

    event.respondWith(cachedResponse.then(cached => (
      cached || networkResponse.catch(() => caches.match(OFFLINE_URL))
    )));
    event.waitUntil(networkResponse.catch(() => undefined));
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok && ['style', 'script', 'image', 'font'].includes(request.destination)) {
        caches.open(STATIC_CACHE).then(cache => cache.put(request, response.clone()));
      }
      return response;
    }))
  );
});