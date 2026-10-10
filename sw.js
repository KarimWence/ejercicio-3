console.log("[SW] Script en ejecución");
console.log("[SW] Contexto global:", self.constructor.name);
console.log("[SW] typeof window =>", typeof window);
console.log("[SW] typeof document =>", typeof document);
console.log("[SW] typeof localStorage =>", typeof localStorage);
console.log("[SW] typeof indexedDB =>", typeof indexedDB);
console.log("[SW] typeof caches =>", typeof caches);
console.log("[SW] Scope =>", self.registration.scope);

const CACHE_VERSION = "proyectos-ods-app-shell-v2";
const API_ORIGIN = "https://api.spaceflightnewsapi.net";
const CDN_ORIGIN = "https://cdn.jsdelivr.net";
const ALLOWED_ORIGINS = [self.location.origin, API_ORIGIN, CDN_ORIGIN];

const APP_SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./styles/main.css",
  "./styles/shell.css",
  "./styles/content.css",
  "./src/main.js",
  "./src/config.js",
  "./src/router/router.js",
  "./src/components/ItemCard.js",
  "./src/components/Skeleton.js",
  "./src/pwa/registerSW.js",
  "./src/services/apiService.js",
  "./src/services/cookieService.js",
  "./src/services/dbService.js",
  "./src/services/itemsService.js",
  "./src/utils/cacheDebug.js",
  "./src/utils/feedback.js",
  "./src/utils/slugify.js",
  "./src/utils/storage.js",
  "./src/utils/theme.js",
  "./src/views/AboutView.js",
  "./src/views/DiagnosticsView.js",
  "./src/views/FavoritesView.js",
  "./src/views/HomeView.js",
  "./src/views/ItemDetailView.js",
  "./src/views/NewsView.js",
  "./src/views/NotFoundView.js",
  "./src/views/ServiceWorkerView.js",
  `${CDN_ORIGIN}/npm/idb@8/+esm`,
];

self.addEventListener("install", (event) => {
  console.log("[SW] install => precacheando", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate => versión activa", CACHE_VERSION);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => {
              console.log("[SW] Borrando caché vieja:", name);
              return caches.delete(name);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    console.log("[SW] Mensaje SKIP_WAITING recibido");
    event.waitUntil(self.skipWaiting());
  }
});

function shouldHandle(request) {
  if (request.method !== "GET") {
    return false;
  }

  if (!ALLOWED_ORIGINS.includes(new URL(request.url).origin)) {
    return false;
  }

  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return false;
  }

  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!shouldHandle(request)) {
    reportFetch(request, "ignored");
    return;
  }

  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const { request } = event;
  const cache = await caches.open(CACHE_VERSION);
  const key =
    request.mode === "navigate"
      ? new URL("./index.html", self.location.href)
      : request;

  return pickStrategy(request)(event, cache, key);
}

function pickStrategy(request) {
  const url = new URL(request.url);

  if (request.mode === "navigate") return cacheFirst;
  if (url.origin === API_ORIGIN) return networkFirst;
  if (url.pathname.endsWith("/data/dato-experimento-2.json")) {
    return staleWhileRevalidate;
  }

  return cacheFirst;
}

async function cacheFirst(event, cache, key) {
  const { request } = event;
  const cached = await cache.match(key);

  if (cached) {
    console.log("[SW] Cache First · HIT =>", request.url);
    reportFetch(request, "cache", "cache-first");
    return cached;
  }

  console.log("[SW] Cache First · MISS =>", request.url);

  try {
    const response = await fromNetwork(request);

    if (response.ok) {
      event.waitUntil(cache.put(key, response.clone()));
    }

    reportFetch(request, "network", "cache-first");
    return response;
  } catch (error) {
    console.warn("[SW] Cache First · red no disponible =>", request.url, error);
    reportFetch(request, "fallback", "cache-first");
    return offlineFallback(request);
  }
}

async function networkFirst(event, cache, key) {
  const { request } = event;

  try {
    const response = await fromNetwork(request);

    if (response.ok) {
      event.waitUntil(cache.put(key, response.clone()));
    }

    console.log("[SW] Network First · red =>", request.url);
    reportFetch(request, "network", "network-first");
    return response;
  } catch (error) {
    const cached = await cache.match(key);

    if (cached) {
      console.log("[SW] Network First · red caída, uso caché =>", request.url);
      reportFetch(request, "cache", "network-first");
      return cached;
    }

    console.warn("[SW] Network First · sin red ni caché =>", request.url, error);
    reportFetch(request, "fallback", "network-first");
    return offlineFallback(request);
  }
}

async function staleWhileRevalidate(event, cache, key) {
  const { request } = event;
  const cached = await cache.match(key);
  const revalidation = fromNetwork(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(key, response.clone());
        reportFetch(request, "updated", "stale-while-revalidate");
      }
      return response;
    })
    .catch((error) => {
      console.warn("[SW] SWR · no se pudo actualizar =>", request.url, error);
      return null;
    });

  if (cached) {
    event.waitUntil(revalidation);
    console.log("[SW] SWR · entrego caché y actualizo en segundo plano =>", request.url);
    reportFetch(request, "cache", "stale-while-revalidate");
    return cached;
  }

  const response = await revalidation;
  if (response) {
    reportFetch(request, "network", "stale-while-revalidate");
    return response;
  }

  reportFetch(request, "fallback", "stale-while-revalidate");
  return offlineFallback(request);
}

function fromNetwork(request) {
  return fetch(request, { cache: "no-store" });
}

function offlineFallback(request) {
  if (request.mode === "navigate") {
    return new Response(
      "<!doctype html><html lang=\"es\"><meta charset=\"utf-8\"><title>Sin conexión</title><h1>Sin conexión</h1><p>No se pudo cargar el sitio y no hay una copia disponible.</p></html>",
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  const url = new URL(request.url);
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  if (url.pathname.endsWith(".json") || acceptsJson) {
    return new Response(
      JSON.stringify({ offline: true, message: "Sin conexión y sin copia en caché" }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  return Response.error();
}

function reportFetch(request, source, strategy) {
  self.clients
    .matchAll({ type: "window" })
    .then((clients) => {
      const path =
        request.url.startsWith(self.location.origin)
          ? request.url.slice(self.location.origin.length)
          : request.url;

      clients.forEach((client) =>
        client.postMessage({
          type: "FETCH_LOG",
          method: request.method,
          path,
          strategy,
          source,
        })
      );
    })
    .catch((error) => console.error("[SW] No se pudo reportar la petición:", error));
}
