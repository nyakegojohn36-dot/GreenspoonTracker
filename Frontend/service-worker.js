const CACHE_NAME = 'greenspoon-v1.4';
const urlsToCache = [
  '/coolerbox.jpg',
  '/logo.png'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache files individually with error handling
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
              return Promise.resolve(); // Don't fail install if one file fails
            })
          )
        );
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Network first, then cache (for HTML and API calls)
// Cache first for images only
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip caching for API calls
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(fetch(event.request));
  }
  
  // For images, use cache first
  if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  } else {
    // For HTML and other files, use network first for fresh content
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response and cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  }
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});
