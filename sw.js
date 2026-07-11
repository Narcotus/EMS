const CACHE_NAME = 'ems-minsk-v3';
const APP_SHELL = [
  './',
  './index.html',
  './css/md3.css',
  './css/app.css',
  './js/db.js',
  './js/router.js',
  './js/theme.js',
  './js/utils.js',
  './js/app.js',
  './js/pages/home.js',
  './js/pages/orders.js',
  './js/pages/guidelines.js',
  './js/pages/calculators.js',
  './js/pages/reference.js',
  './manifest.json',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192.svg',
];

// Установка — кешируем всю оболочку
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        APP_SHELL.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('Failed to cache:', url, err);
          });
        })
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Активация — удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch — стратегия: кеш сначала, сеть потом (Cache First)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Найдено в кеше — возвращаем сразу
      if (cachedResponse) {
        return cachedResponse;
      }

      // Нет в кеше — идём в сеть
      return fetch(event.request).then((networkResponse) => {
        // Кешируем успешные ответы
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Офлайн — для HTML отдаём index.html
        if (event.request.headers.get('accept') && 
            event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./') || caches.match('./index.html');
        }
        // Для остального — ошибка
        return new Response('Офлайн. Данные недоступны.', { 
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});

// Сообщение от клиента — принудительное обновление кеша
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
