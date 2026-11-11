// =====================================================================
// FinanSync Pro - Service Worker (v4)
// - Rutas relativas (compatible GitHub Pages)
// - skipWaiting + clients.claim (actualización inmediata)
// - Ignora script.google.com (CORS de Apps Script)
// =====================================================================

const CACHE_NAME = 'finansync-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar: cachear recursos y forzar activación inmediata
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Activa este SW sin esperar a que se cierren las pestañas
});

// Activar: limpiar cachés viejas y tomar control de las pestañas abiertas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME)
              .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim() // Toma control de las pestañas ya abiertas
    ])
  );
});

// Fetch: ignorar Apps Script, cache-first para el resto
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a Google Apps Script (deja que el navegador maneje CORS)
  if (event.request.url.includes('script.google.com')) {
    return; // No llamamos respondWith → va directo a la red
  }

  // Solo manejar GET (los POST no se cachean)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Opcional: cachear nuevas respuestas para futuras visitas
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline para navegación
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});