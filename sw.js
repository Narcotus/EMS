var CACHE_NAME = 'ems-minsk-v1';
var ASSETS = [
  'index.html',
  'js/app.js',
  'js/data.js',
  'js/utils.js',
  'js/db.js',
  'css/main.css',
  'manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Кеширование основных файлов');
        return cache.addAll(ASSETS);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(cached) {
        if (cached) {
          fetch(event.request)
            .then(function(response) {
              if (response.ok) {
                caches.open(CACHE_NAME).then(function(cache) {
                  cache.put(event.request, response.clone());
                });
              }
            })
            .catch(function() {});
          return cached;
        }
        return fetch(event.request)
          .then(function(response) {
            if (response.ok) {
              var cloned = response.clone();
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, cloned);
              });
            }
            return response;
          })
          .catch(function() {
            return caches.match('index.html');
          });
      })
  );
});
