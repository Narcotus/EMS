// ============================================================
// DB — Работа с IndexedDB
// ============================================================
var DB_NAME = 'emsMinskDB';
var DB_VERSION = 1;
var db = null;

function openDB() {
  console.log('🔄 Opening IndexedDB...');
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      console.log('⚙️ Upgrading IndexedDB...');
      var db = e.target.result;
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
        console.log('✅ Created favorites store');
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
        console.log('✅ Created cache store');
      }
    };
    request.onsuccess = function(e) {
      db = e.target.result;
      console.log('✅ IndexedDB opened');
      resolve(db);
    };
    request.onerror = function(e) {
      console.error('❌ IndexedDB error:', e.target.error);
      reject(e.target.error);
    };
  });
}

function loadFavorites() {
  if (!db) {
    console.warn('⚠️ DB not initialized, returning empty set');
    return Promise.resolve(new Set());
  }
  return new Promise(function(resolve) {
    try {
      var tx = db.transaction('favorites', 'readonly');
      var store = tx.objectStore('favorites');
      var result = [];
      store.openCursor().onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        } else {
          console.log('✅ Favorites loaded:', result.length);
          resolve(new Set(result.map(function(item) { return item.id; })));
        }
      };
      store.openCursor().onerror = function() {
        console.warn('⚠️ Error loading favorites, returning empty');
        resolve(new Set());
      };
    } catch (e) {
      console.error('❌ Error loading favorites:', e);
      resolve(new Set());
    }
  });
}

function toggleFavorite(id, favorites) {
  if (!db) {
    console.error('❌ DB not initialized');
    return Promise.reject('DB not initialized');
  }
  return new Promise(function(resolve, reject) {
    try {
      var tx = db.transaction('favorites', 'readwrite');
      var store = tx.objectStore('favorites');
      if (favorites.has(id)) {
        store.delete(id);
        favorites.delete(id);
        console.log('🗑️ Removed from favorites:', id);
      } else {
        store.put({ id: id });
        favorites.add(id);
        console.log('⭐ Added to favorites:', id);
      }
      tx.oncomplete = function() {
        resolve(favorites);
      };
      tx.onerror = function(e) {
        console.error('❌ Transaction error:', e);
        reject(e);
      };
    } catch (e) {
      console.error('❌ Error toggling favorite:', e);
      reject(e);
    }
  });
}

console.log('✅ DB module loaded');
