const CACHE_NAME = 'mtg-tracker-v1';
const IMAGE_CACHE = 'mtg-images-v1';

// Assets to cache immediately on install (the app itself)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add your main JS and CSS bundles here if not using a bundler like Vite/CRA
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // STRATEGY: Cache-First for Images (Scryfall/Art URLs)
  if (request.destination === 'image' || url.hostname.includes('scryfall')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return response || fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // STRATEGY: Network-First for everything else (API calls)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});