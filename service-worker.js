self.addEventListener('install', event => {
  event.waitUntil(async function installWaitUntil() {
    // Cache everything the app should need to run offline
    const cache = await caches.open('static-assets-v1');
    await cache.addAll([
      'index.html',
      'main.js',
      'style.css',
      'tiles.css',
      'images/azul_logo.svg',
      'images/tile-value.svg',
      'images/all-color-bonus.svg',
      'images/horizontal-bonus.svg',
      'images/vertical-bonus.svg',
      'sounds/clink.mp3',
      'sounds/swoosh.mp3',
    ]);
  }());
});

self.addEventListener('fetch', event => {
  event.respondWith(async function fetchRespondWith() {
    const cache = await caches.open('static-assets-v1');

    // Start fetching from network (but don't await it)
    const networkResponse = fetch(event.request).then(networkResponse => {
      cache.put(event.request, networkResponse.clone());
      return networkResponse;
    });

    // If there's a cached response, use that immediately while the fetch
    // completes and updates the cache in the background.
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return networkResponse;
  }());
});
