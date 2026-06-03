// ═══════════════════════════════════════════════
//  Canada Provinces PWA — Service Worker
//  Cache strategy:
//    • App shell (HTML, manifest)  → Cache-first
//    • Leaflet JS/CSS (CDN)        → Cache-first (versioned, safe)
//    • OSM map tiles               → Cache-first with 500-tile cap
//    • Google Fonts                → Cache-first
// ═══════════════════════════════════════════════

const APP_VERSION   = 'v1.0.0';
const SHELL_CACHE   = `canada-shell-${APP_VERSION}`;
const TILE_CACHE    = `canada-tiles-${APP_VERSION}`;
const FONT_CACHE    = `canada-fonts-${APP_VERSION}`;
const MAX_TILES     = 500;

const SHELL_URLS = [
  './index.html',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap'
];

// ── Install: pre-cache shell ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_URLS).catch(err => {
        // Non-fatal — fonts/CDN may fail in some envs
        console.warn('[SW] Some shell URLs failed to pre-cache:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────
self.addEventListener('activate', event => {
  const KEEP = [SHELL_CACHE, TILE_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. OSM tile requests → tile cache (LRU-ish cap)
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(tileStrategy(event.request));
    return;
  }

  // 2. Google Fonts → font cache
  if (url.hostname.includes('fonts.g') || url.hostname.includes('fonts.googleapis')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  // 3. Leaflet CDN → shell cache
  if (url.hostname.includes('unpkg.com')) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
    return;
  }

  // 4. App shell (same origin) → cache-first, fallback to network
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
    return;
  }

  // 5. Everything else → network only (don't interfere)
});

// ── Strategies ───────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return simple offline page for HTML
    if (request.destination === 'document') {
      return offlinePage();
    }
    return new Response('', { status: 503 });
  }
}

async function tileStrategy(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Enforce tile cap to avoid unbounded storage
      const keys = await cache.keys();
      if (keys.length >= MAX_TILES) {
        // Evict oldest 50
        await Promise.all(keys.slice(0, 50).map(k => cache.delete(k)));
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

function offlinePage() {
  return new Response(
    `<!DOCTYPE html><html lang="he" dir="rtl">
    <head><meta charset="UTF-8"><title>אין חיבור</title>
    <style>
      body{font-family:Arial;display:flex;align-items:center;justify-content:center;
           min-height:100vh;background:#eef4fb;color:#1a2540;text-align:center}
      h1{font-size:2rem;margin-bottom:8px} p{color:#5a6a8a;font-size:1rem}
    </style></head>
    <body><div><div style="font-size:3rem">🍁</div>
    <h1>אין חיבור לאינטרנט</h1>
    <p>No internet connection.<br>Please reconnect and try again.</p>
    </div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ── Message: force update ─────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
