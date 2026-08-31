/* Service Worker — CELDYQUÉ offline cache & speed boost */
const CACHE_NAME = 'celdyque-v6-retailer-nav';
const PRECACHE = [
  '/',
  '/index.html',
  '/assets/site.css?v=20260831-retailer-nav',
  '/assets/home.css?v=20260831-retailer-nav',
  '/assets/site.js?v=20260831-retailer-nav',
  '/assets/analytics.js?v=20260828-consent',
  '/partials/header.html?v=20260831-retailer-nav',
  '/partials/footer.html?v=20260831-retailer-nav',
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

  // Keep native video seeking and partial responses on the network.
  if (e.request.headers.has('range') || e.request.destination === 'video' || /\.mp4$/i.test(url.pathname)) return;

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
