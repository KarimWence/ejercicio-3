// utils/connectivity.js
// Gestor del estado de conexión (Online / Offline) de la aplicación

const STATUS_ELEMENT_ID = "networkStatusBanner";
const MESSAGE_ELEMENT_ID = "networkStatusMessage";

let hideTimeout = null;

/**
 * Actualiza el indicador visual según la conectividad del navegador.
 * Utiliza redacción propia para describir el estado operativo de la PWA.
 */
export function updateConnectionStatus() {
  const banner = document.getElementById(STATUS_ELEMENT_ID);
  const message = document.getElementById(MESSAGE_ELEMENT_ID);

  if (!banner || !message) {
    return;
  }

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  const isOnline = navigator.onLine;

  if (!isOnline) {
    banner.hidden = false;
    banner.className = "network-banner network-banner--offline";
    message.textContent =
      "Modo sin conexión · Navegando con recursos locales guardados en caché.";
  } else {
    // Si ya estaba en línea y no estaba visible, se mantiene oculto
    if (banner.hidden) {
      return;
    }

    banner.hidden = false;
    banner.className = "network-banner network-banner--online";
    message.textContent =
      "Conexión reanudada · Los datos y vistas se sincronizarán con la red.";

    hideTimeout = setTimeout(() => {
      banner.hidden = true;
    }, 3500);
  }
}

/**
 * Inicializa los escuchadores de eventos de red en la ventana.
 */
export function initializeConnectivity() {
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);

  // Verificación del estado inicial
  updateConnectionStatus();
}
