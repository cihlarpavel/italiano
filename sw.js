// Offline režim: aplikace se načte i bez signálu (kartičky a časy fungují, konverzace potřebuje internet).
// Soubory se servírují z mezipaměti a na pozadí se obnovují, takže nová verze se projeví při dalším spuštění.
const CACHE = 'italiano-v7';
const SHELL = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', 'js/app.js', 'js/data.js',
  'js/store.js', 'js/speech.js', 'js/chat.js', 'js/ui.js', 'js/prizpusobit.js', 'js/claude.js', 'js/preklad.js', 'icons/icon-180.png', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const cacheable = url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net';
  if (!cacheable) return; // API volání jdou vždy rovnou na síť
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; });
    return hit ? (fresh.catch(() => {}), hit) : fresh;
  }));
});
