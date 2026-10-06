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

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate => versión activa", CACHE_VERSION);

  // Requisito 6: Al cambiar CACHE_VERSION, activate elimina la caché anterior
  // y toma el control de los clientes para que las entradas en runtime se guarden en la nueva versión.
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
              console.log("[SW] Borrando caché vieja:", cacheName);
              return caches.delete(cacheName);
            }
            return undefined;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo atendemos peticiones GET porque son de lectura segura.
  // Métodos como POST, PUT o DELETE pueden modificar datos y no se deben responder desde caché.
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  // Solo atendemos peticiones de nuestro mismo origen para no interferir con
  // APIs externas (como las noticias o Google Fonts) ni tener problemas de CORS.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      // Navegaciones de la SPA: servimos el App Shell (index.html) para no duplicar entradas en caché
      if (request.mode === "navigate") {
        const appShellUrl = new URL("./index.html", self.location).href;
        const appShellFallbackUrl = new URL("./", self.location).href;

        const cachedShell =
          (await cache.match(appShellUrl)) ||
          (await cache.match(appShellFallbackUrl)) ||
          (await cache.match("./index.html")) ||
          (await cache.match("./"));

        if (cachedShell) {
          console.log("[SW] HIT", request.url);
          return cachedShell;
        }

        console.log("[SW] MISS", request.url);
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          event.waitUntil(cache.put(appShellUrl, responseClone));
        }

        return networkResponse;
      }

      // Búsqueda en caché antes de ir a la red
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        console.log("[SW] HIT", request.url);
        return cachedResponse;
      }

      console.log("[SW] MISS", request.url);

      const networkResponse = await fetch(request);

      // Guardado en runtime: solo respuestas exitosas (200-299), sin guardar errores
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        event.waitUntil(cache.put(request, responseClone));
      }

      return networkResponse;
    })()
  );
});
