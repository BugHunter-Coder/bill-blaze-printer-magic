/* eslint-disable no-restricted-globals */

/* 🔄  bump this version on every deploy */
const CACHE_VERSION = 'v2';
const CACHE_NAME    = `billblaze-pos-${CACHE_VERSION}`;

/* static files that never change post-build */
const ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/offline.html',
];

/* ---------- Install ---------- */
self.addEventListener('install', event => {
  self.skipWaiting(); // jump the wait queue
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

/* ---------- Activate ---------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------- Fetch ---------- */
self.addEventListener('fetch', event => {
  const { request } = event;

  /* 1️⃣ navigations → network-first */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  /* 2️⃣ everything else → cache-first */
  event.respondWith(
    caches.match(request).then(res => res || fetch(request))
  );
});

/* ---------- (Optional) BT messages ---------- */
self.addEventListener('message', event => {
  if (event.data?.type === 'BLUETOOTH_REQUEST') {
    // bluetooth-specific logic here
    console.log('Bluetooth request in SW');
  }
});
