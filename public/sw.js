const CACHE_NAME = 'mtg-tracker-v2';
const IMAGE_CACHE = 'mtg-images-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/manifest.json',
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== IMAGE_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and backend API calls entirely
  if (request.method !== 'GET') return;
  if (url.hostname === 'edh-backend.onrender.com') return;

  // Cache-first for images
  if (request.destination === 'image' || url.hostname.includes('scryfall')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) =>
          cached || fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          })
        )
      )
    );
    return;
  }

  // Stale-while-revalidate for everything else (app shell + JS/CSS bundles)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    )
  );
});
