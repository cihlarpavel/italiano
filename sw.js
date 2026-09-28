// Offline režim: aplikace se načte i bez signálu (kartičky a časy fungují, konverzace a překlad potřebují internet).
// Strategie „nejdřív síť“: s internetem se vždy načte aktuální verze všech souborů najednou
// (jinak by se po aktualizaci mohly smíchat nové a staré moduly), mezipaměť je jen záloha bez signálu.
const CACHE = 'paolo-v24';
const SHELL = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', 'js/app.js', 'js/data.js',
  'js/store.js', 'js/speech.js', 'js/chat.js', 'js/ui.js', 'js/prizpusobit.js', 'js/claude.js', 'js/preklad.js', 'js/italie.js', 'js/italie_top.js', 'js/italie_cesta.js', 'js/pamet.js', 'js/prehled.js', 'js/mapa.js', 'js/fotky.js', 'js/top1000.js', 'js/slova.js', 'js/tokeny.js', 'js/sync.js',
  'icons/icon-180.png', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // „pablo-hlas“ je mezipaměť vygenerovaných hlasů – ta se nemaže.
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'pablo-hlas').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const own = url.origin === location.origin;
  if (!own && url.hostname !== 'cdn.jsdelivr.net' && url.hostname !== 'cdnjs.cloudflare.com') return; // API volání jdou vždy rovnou na síť
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(e.request, own ? { cache: 'no-cache' } : {});
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || Response.error();
    }
  })());
});
