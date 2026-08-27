const CACHE_NAME = 'mtg-tracker-v4';
const IMAGE_CACHE = 'mtg-images-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/manifest.json',
      '/stats/index.html',
      '/stats/player.html',
      '/stats/deck.html',
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

  // Network-first for the HTML app shell (navigations, "/", "/index.html").
  // This is the fix: index.html references hashed JS/CSS bundle filenames,
  // so it must always be fetched fresh when possible - otherwise a deploy
  // can silently take two reloads to actually show up (stale-while-revalidate
  // was serving yesterday's HTML on the very load that was supposed to pick
  // up today's build).
  const isAppShell = request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html';
  if (isAppShell) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then((cache) =>
          // ignoreSearch only strips the query string, not the path - so this correctly
          // matches this exact page first (e.g. /stats/player.html), and only falls back
          // to the main app shell ('/') if this specific page was never cached at all.
          cache.match(request, { ignoreSearch: true }).then((match) => match || cache.match('/'))
        ))
    );
    return;
  }

  // Stale-while-revalidate for everything else (hashed JS/CSS bundles, etc.
  // - safe to serve instantly from cache since their filenames change on
  // every build, so a cached copy is never actually stale content).
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
