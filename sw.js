const CACHE_NAME = 'budget-pwa-cache-v4'; // Bumped to v4 to force an update
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Force activate immediately
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch event - Cache First, fallback to Network
self.addEventListener('fetch', (event) => {
  // We only want to intercept standard GET requests for static files.
  // We explicitly IGNORE our POST requests to Google Apps Script.
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    // ignoreSearch: true is critical! It ensures that if the browser adds 
    // query parameters like ?utm_source=homescreen, it still finds the cached file.
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Clone network response and put in cache (for static assets)
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      // Optional offline fallback could go here
    })
  );
});
