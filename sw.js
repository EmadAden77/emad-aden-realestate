const VERSION = 'emad-realestate-v6';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/404.html';
const PRECACHE = [
  '/', '/index.html', OFFLINE_URL, '/manifest.json', '/IMG_5.jpg',
  '/assets/css/home.bundle.css', '/assets/css/articles.css',
  '/assets/js/luxury-home.js', '/assets/js/articles.js'
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
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(PAGE_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then(hit => hit || caches.match(OFFLINE_URL))));
    return;
  }
  event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
    if (response.ok && ['style', 'script', 'image', 'font'].includes(request.destination)) {
      caches.open(STATIC_CACHE).then(cache => cache.put(request, response.clone()));
    }
    return response;
  })));
});
