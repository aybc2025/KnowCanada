// Canada PWA v3 — Service Worker
const APP_VERSION = 'v3.0.0';
const SHELL_CACHE = `canada-shell-${APP_VERSION}`;
const TILE_CACHE  = `canada-tiles-${APP_VERSION}`;
const FONT_CACHE  = `canada-fonts-${APP_VERSION}`;
const MAX_TILES   = 600;

const SHELL_URLS = [
  './index.html',
  './manifest.json',
  './style.css',
  './data.js',
  './cards.js',
  './map.js',
  './flashcard.js',
  './quiz.js',
  './timeline.js',
  './app.js',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL_URLS).catch(e => console.warn('[SW] pre-cache partial fail:', e)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const KEEP = [SHELL_CACHE, TILE_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(tileStrategy(event.request)); return;
  }
  if (url.hostname.includes('fonts.g') || url.hostname.includes('fonts.googleapis')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE)); return;
  }
  if (url.hostname.includes('unpkg.com') || url.hostname.includes('wikimedia') || url.hostname.includes('githubusercontent')) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE)); return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE)); return;
  }
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) { const c = await caches.open(cacheName); c.put(req, res.clone()); }
    return res;
  } catch {
    if (req.destination === 'document') return offlinePage();
    return new Response('', { status: 503 });
  }
}

async function tileStrategy(req) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const keys = await cache.keys();
      if (keys.length >= MAX_TILES) await Promise.all(keys.slice(0, 60).map(k => cache.delete(k)));
      cache.put(req, res.clone());
    }
    return res;
  } catch { return new Response('', { status: 503 }); }
}

function offlinePage() {
  return new Response(
    `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><title>אין חיבור</title>
    <style>body{font-family:Arial;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f4f7fb;color:#18243a;text-align:center}h1{font-size:2rem;margin-bottom:8px}p{color:#4a5a78}</style></head>
    <body><div><div style="font-size:3rem">🍁</div><h1>אין חיבור לאינטרנט</h1><p>No internet connection.<br>Reconnect and try again.</p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
