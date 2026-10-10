// utils/cacheDebug.js
// Funciones para listar, borrar entradas de la caché y probar datos desactualizados

import { withBasePath } from "../config.js";

export const CACHE_VERSION = "proyectos-ods-app-shell-v3";
export const NETWORK_FIRST_REL_URL = "data/dato-experimento.json";
export const SWR_REL_URL = "data/dato-experimento-2.json";
export const EXPERIMENT_REL_URL = SWR_REL_URL;

// Obtiene la caché activa
export async function getActiveCache() {
  if (!("caches" in window)) {
    return null;
  }

  try {
    const keys = await caches.keys();
    const activeName =
      keys.find((k) => k === CACHE_VERSION) ||
      keys.find((k) => k.startsWith("proyectos-ods-")) ||
      keys[0];

    if (!activeName) return null;

    const cache = await caches.open(activeName);
    return { name: activeName, cache };
  } catch (error) {
    console.error("Error al abrir caché:", error);
    return null;
  }
}

// Lista todas las peticiones guardadas en la caché
export async function listCacheEntries() {
  const active = await getActiveCache();
  if (!active) return [];

  try {
    const requests = await active.cache.keys();

    return requests.map((req) => {
      const url = req.url;
      let pathname = url;
      try {
        pathname = new URL(url).pathname;
      } catch (_) {}

      const isAppShell =
        pathname.endsWith("/index.html") ||
        pathname.endsWith("/styles/main.css") ||
        pathname.endsWith("/styles/shell.css") ||
        pathname.endsWith("/styles/content.css") ||
        pathname.endsWith("/src/main.js") ||
        url === new URL(".", document.baseURI).href ||
        url === new URL("index.html", document.baseURI).href;

      return {
        url,
        pathname,
        type: isAppShell ? "Precache" : "Runtime",
        cacheName: active.name,
      };
    });
  } catch (error) {
    console.error("Error al listar entradas:", error);
    return [];
  }
}

// Elimina una entrada con cache.delete()
export async function deleteCacheEntry(url) {
  const active = await getActiveCache();
  if (!active) return false;

  try {
    const deleted = await active.cache.delete(url);
    console.log(`[Cache] delete(${url}) =>`, deleted);

    window.dispatchEvent(
      new CustomEvent("cache-updated", {
        detail: { url, deleted, cacheName: active.name },
      })
    );

    return deleted;
  } catch (error) {
    console.error("Error al eliminar de caché:", error);
    return false;
  }
}

// Simula guardar una versión anterior en caché para el experimento
export async function seedOutdatedExperimentData() {
  const active = await getActiveCache();
  if (!active) return false;

  const targetUrl = new URL(withBasePath(EXPERIMENT_REL_URL), window.location.origin).href;

  const staleData = {
    version: 1,
    titulo: "Convocatoria ODS 2026",
    mensaje: "Fase preliminar: recepción de proyectos sin financiamiento asignado.",
    actualizado: "2026-09-01T08:00:00Z",
  };

  const fakeResponse = new Response(JSON.stringify(staleData, null, 2), {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });

  try {
    await active.cache.put(targetUrl, fakeResponse);
    console.log("[Cache] Versión anterior guardada en caché para:", targetUrl);

    window.dispatchEvent(
      new CustomEvent("cache-updated", {
        detail: { url: targetUrl, seeded: true, cacheName: active.name },
      })
    );

    return true;
  } catch (error) {
    console.error("Error al guardar dato en caché:", error);
    return false;
  }
}

// Consulta el recurso de prueba (compatibilidad)
export async function fetchExperimentResource() {
  return fetchSwrResource();
}

// Consulta el recurso asignado a Network First
export async function fetchNetworkFirstResource() {
  const targetUrl = new URL(withBasePath(NETWORK_FIRST_REL_URL), window.location.origin).href;
  const isOnline = navigator.onLine;

  const response = await fetch(withBasePath(NETWORK_FIRST_REL_URL));
  const data = await response.json();

  return {
    url: targetUrl,
    data,
    source: isOnline ? "Red (Network First prioritario)" : "Caché local (Network First fallback)",
    isOnline,
  };
}

// Consulta el recurso asignado a Stale-While-Revalidate
export async function fetchSwrResource() {
  const targetUrl = new URL(withBasePath(SWR_REL_URL), window.location.origin).href;
  const active = await getActiveCache();

  let wasInCache = false;
  if (active) {
    const matched = await active.cache.match(targetUrl);
    wasInCache = Boolean(matched);
  }

  const response = await fetch(withBasePath(SWR_REL_URL));
  const data = await response.json();

  return {
    url: targetUrl,
    data,
    source: wasInCache ? "Caché instantánea (revalidando en segundo plano)" : "Red directa",
    wasInCache,
  };
}

// Disponible también desde consola para depuración
if (typeof window !== "undefined") {
  window.cacheDebug = {
    getActiveCache,
    list: async () => {
      const entries = await listCacheEntries();
      console.table(entries);
      return entries;
    },
    delete: deleteCacheEntry,
    seedStale: seedOutdatedExperimentData,
    fetchExperiment: fetchExperimentResource,
    fetchNetworkFirst: fetchNetworkFirstResource,
    fetchSwr: fetchSwrResource,
  };
}
