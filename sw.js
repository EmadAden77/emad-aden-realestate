const VERSION = 'emad-realestate-v15-update-safe';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/404.html';
const PRECACHE = [
  '/', '/index.html', '/app.html', OFFLINE_URL, '/manifest.json', '/IMG_5-header.jpg',
  '/assets/css/home.bundle.css?v=20260813-original-header',
  '/assets/css/articles.css',
  '/assets/css/luxury-header.css?v=20260813-logo-size',
  '/assets/js/luxury-home.js?v=20260813-logo-size',
  '/assets/js/articles.js'
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

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(async response => {
        if (response.ok) {
          const cache = await caches.open(PAGE_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(async () => (
        await caches.match(request, {ignoreSearch:true}) ||
        await caches.match('/index.html') ||
        await caches.match(OFFLINE_URL)
      ))
    );
    return;
  }

  if (['style', 'script'].includes(request.destination)) {
    event.respondWith(
      fetch(request).then(async response => {
        if (response.ok) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  if (['image', 'font'].includes(request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      const update = fetch(request).then(async response => {
        if (response.ok) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(() => cached);
      return cached || update;
    })());
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request, { ignoreSearch: true })));
});
