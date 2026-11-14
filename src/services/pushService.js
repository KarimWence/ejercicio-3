import { withBackendUrl } from "../config.js";
import { getAuthToken } from "./authService.js";

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);

  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function assertAuthenticated() {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Inicia sesión antes de activar las notificaciones.");
  }

  return token;
}

async function requestPushApi(path, options = {}) {
  const token = assertAuthenticated();
  const response = await fetch(withBackendUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "No fue posible actualizar las notificaciones.");
  }

  return data;
}

export function isPushSupported() {
  return (
    "Notification" in window &&
    "PushManager" in window &&
    "serviceWorker" in navigator
  );
}

export async function getPushState() {
  if (!isPushSupported()) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
  };
}

async function getPublicKey() {
  const response = await fetch(withBackendUrl("api/push/public-key"));
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.publicKey) {
    throw new Error(data?.error || "No fue posible obtener la llave pública de notificaciones.");
  }

  return data.publicKey;
}

async function saveSubscription(subscription) {
  await requestPushApi("api/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Este navegador no admite notificaciones Push.");
  }

  assertAuthenticated();

  const permission = await Notification.requestPermission();

  if (permission === "denied") {
    throw new Error("Las notificaciones están bloqueadas. Habilítalas desde la configuración del sitio.");
  }

  if (permission !== "granted") {
    throw new Error("No se concedió permiso para mostrar notificaciones.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const publicKey = await getPublicKey();

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await saveSubscription(subscription);
  return subscription;
}

/** Reenvía una suscripción existente al iniciar la app. No abre diálogos. */
export async function resendPushSubscription() {
  if (!isPushSupported() || Notification.permission !== "granted" || !getAuthToken()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await saveSubscription(subscription);
  return true;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await requestPushApi("api/push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
  return true;
}
