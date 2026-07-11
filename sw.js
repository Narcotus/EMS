const CACHE_NAME = 'ems-minsk-v1';
const APP_SHELL = [
  '/', '/index.html', '/css/md3.css', '/css/app.css',
  '/js/db.js', '/js/router.js', '/js/theme.js', '/js/utils.js', '/js/app.js',
  '/js/pages/home.js', '/js/pages/orders.js', '/js/pages/guidelines.js',
  '/js/pages/calculators.js', '/js/pages/reference.js',
  '/manifest.json', '/icons/icon-192.svg', '/icons/icon-192.png', '/icons/icon-512.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE_NAME).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r => { if (r && r.status === 200) { const rc = r.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, rc)); } return r; }).catch(() => e.request.headers.get('accept').includes('text/html') ? caches.match('/') : new Response('Offline', { status: 503 })))));
});
