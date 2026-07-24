const CACHE_NAME = 'emad-realestate-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/expatriates-property-management.html',
  '/assets/css/expatriates.css',
  '/assets/js/expatriates.js',
  '/manifest.json',
  '/data.json',
  '/IMG_5.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => (cacheName === CACHE_NAME ? undefined : caches.delete(cacheName)))
    ))
  );
  self.clients.claim();
});
