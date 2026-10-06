const CACHE_VERSION = "proyectos-ods-app-shell-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles/main.css",
  "./styles/shell.css",
  "./styles/content.css",
  "./src/main.js",
];

self.addEventListener("install", (event) => {
  console.log("[SW] install => precacheando", CACHE_VERSION);

  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));

});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate => versión activa", CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) =>Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log("[SW] Borrando caché vieja", cacheName);
            return caches.delete(cacheName);
          }

          return undefined;
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo GET es seguro de responder desde caché; otros métodos pueden modificar datos.
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  // No gestionamos recursos externos para no alterar solicitudes fuera de esta app.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log("[SW] HIT", request.url);
          return cachedResponse;
        }

        console.log("[SW] MISS", request.url);
        return fetch(request);
      })
    )
  );
});
