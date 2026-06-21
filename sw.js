const CACHE_NAME = "farsiflow-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./characters.html",
  "./viewer.html",
  "./poetry.html",
  "./poemViewer.html",
  "./poetryGame.html",
  "./stories.html",
  "./storyViewer.html",
  "./quiz.html",
  "./search.html",
  "./typing.html",
  "./contact.html",
  "./dialect.html",
  "./style.css",
  "./layout.js",
  "./script.js",
  "./characters.js",
  "./poemViewer.js",
  "./poetry.js",
  "./poetryGame.js",
  "./stories.js",
  "./storyViewer.js",
  "./quiz.js",
  "./search.js",
  "./typing.js",
  "./contact.js",
  "./manifest.json",
  "./data_farsi.json",
  "./stories_farsi.json",
  "./poetry_farsi.json",
  "./flute.mp3",
  "./icon-192.png",
  "./icon-512.png"
];

// ===== INSTALL: Pre-cache all assets =====
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching all app assets");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ===== ACTIVATE: Clear old caches =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Clearing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ===== FETCH: Cache-first with network update fallback =====
self.addEventListener("fetch", (event) => {
  // Only intercept same-origin and http/https requests
  if (
    !event.request.url.startsWith("http") ||
    event.request.url.includes("translate.google.com") ||
    event.request.url.includes("cdn.jsdelivr.net") ||
    event.request.url.includes("emailjs")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Serve from cache immediately, update in background
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) =>
                cache.put(event.request, networkResponse)
              );
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(event.request, responseClone)
        );
        return networkResponse;
      });
    })
  );
});
