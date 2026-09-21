import { withBasePath } from "../config.js";

export const SW_URL = withBasePath("sw.js");
export const SW_SCOPE = withBasePath("");

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("[PWA] Este navegador no soporta Service Workers");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: SW_SCOPE
    });

    console.log("[PWA] SW registrado. Scope:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[PWA] Falló el registro del SW:", error);
    return null;
  }
}