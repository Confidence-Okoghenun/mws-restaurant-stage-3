const cacheName = "restaurantsReviewsPWA";
const dataCacheName = "restaurantsMapData";
const filesToCache = [
  "/",
  "/index.html",
  "/service-worker.js",
  "/restaurant.html",
  "/restaurant.html?id=1",
  "/restaurant.html?id=2",
  "/restaurant.html?id=3",
  "/restaurant.html?id=4",
  "/restaurant.html?id=5",
  "/restaurant.html?id=6",
  "/restaurant.html?id=7",
  "/restaurant.html?id=8",
  "/restaurant.html?id=9",
  "/restaurant.html?id=10",
  "/js/localforage.min.js",
  "/js/dbhelper.js",
  "/js/main.js",
  "/js/restaurant_info.js",
  "/css/styles.css",
  "/img/1-s.jpg",
  "/img/2-s.jpg",
  "/img/3-s.jpg",
  "/img/4-s.jpg",
  "/img/5-s.jpg",
  "/img/6-s.jpg",
  "/img/7-s.jpg",
  "/img/8-s.jpg",
  "/img/9-s.jpg",
  "/img/10-s.jpg"
];

const restaurantsReviewsMapUrlBase = `https://api.tiles.mapbox.com`;

/**
 * Cache site assets
 */
self.addEventListener("install", e => {
  console.log("[ServiceWorker] Install");
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log("[ServiceWorker] Caching app shell");
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener("activate", e => {
  console.log("[ServiceWorker] Activate");
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== cacheName && key !== dataCacheName) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", e => {
  if (e.request.url.startsWith(restaurantsReviewsMapUrlBase)) {
    e.respondWith(
      fetch(e.request).then(response => {
        return caches.open(dataCacheName).then(cache => {
          cache.put(e.request.url, response.clone());
          console.log("[ServiceWorker] Fetched & Cached", e.request.url);
          return response;
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(response => {
        console.log("[ServiceWorker] Fetch", e.request.url);
        return response || fetch(e.request);
      })
    );
  }
});
