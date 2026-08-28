/* Service Worker — CELDYQUÉ offline cache & speed boost */
const CACHE_NAME = 'celdyque-v2-analytics-consent';
const PRECACHE = [
  '/',
  '/index.html',
  '/assets/site.css?v=20260828-consent',
  '/assets/home.css',
  '/assets/site.js?v=20260828-consent',
  '/assets/analytics.js?v=20260828-consent',
  '/partials/header.html',
  '/partials/footer.html?v=20260828-consent',
];

/* Install: precache critical assets */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

/* Activate: clean old caches */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: stale-while-revalidate for assets, network-first for HTML */
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and external requests
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // HTML pages: network-first (always fresh)
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets (CSS/JS/images/videos): stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
