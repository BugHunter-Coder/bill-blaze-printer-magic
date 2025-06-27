
const CACHE_NAME = 'billblaze-pos-v1';
const urlsToCache = [
  '/',
  '/pos',
  '/dashboard',
  '/auth',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Handle Bluetooth permissions for PWA
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'BLUETOOTH_REQUEST') {
    // Handle Bluetooth requests in service worker context if needed
    console.log('Bluetooth request received in SW');
  }
});
