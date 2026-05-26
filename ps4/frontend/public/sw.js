/* ====================================================================
   PUERTA SEGURA v3.0 — Service Worker (PWA)
   Estrategia: Cache-first para estáticos, Network-first para la API
   ==================================================================== */

const CACHE_NAME   = 'ps-v3-cache-v1';
const API_CACHE    = 'ps-v3-api-cache-v1';
const OFFLINE_URL  = '/offline.html';

// Recursos a pre-cachear al instalar
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ── Instalación ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activación — limpiar caches viejas ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — estrategia híbrida ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones no GET y WebSockets
  if (request.method !== 'GET') return;
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // API: Network-first → si falla, caché → si no hay caché, error offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 5000));
    return;
  }

  // Archivos estáticos: Cache-first → si no hay, red
  if (url.pathname.match(/\.(js|css|png|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML (rutas SPA): Network-first → si falla, caché → página offline
  event.respondWith(
    fetch(request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('/');
      })
  );
});

// ── Estrategia: cache-first ───────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(c => c.put(request, clone));
  }
  return response;
}

// ── Estrategia: network-first con timeout ────────────────────────
async function networkFirstWithCache(request, cacheName, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const clone = response.clone();
      caches.open(cacheName).then(c => c.put(request, clone));
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await caches.match(request, { cacheName });
    return cached || new Response(
      JSON.stringify({ error: 'Sin conexión', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Push notifications (futuro) ───────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const { title, body, icon } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title || 'Puerta Segura', {
      body: body || '',
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'ps-notification',
    })
  );
});
