const CACHE_NAME = 'finansync-v3'; // v3 para forzar actualización
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 🔑 CLAVE: ignorar TODAS las peticiones a Google Apps Script
  // para que vayan directas a la red y el navegador maneje CORS sin interferencia.
  if (event.request.url.includes('script.google.com')) {
    return; // No hacemos respondWith → va directo a la red
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});