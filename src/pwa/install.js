let deferredPrompt = null;
let installedThisSession = false;
let initialized = false;

const standaloneMedia = window.matchMedia(
  "(display-mode: standalone)"
);

function isRunningInstalled() {
  return standaloneMedia.matches ||
    navigator.standalone === true;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1
    );
}

function updateInstallUI() {
  const button = document.getElementById("installAppButton");
  const message = document.getElementById("installAppMessage");

  if (!button || !message) return;

  const runningInstalled = isRunningInstalled();

  button.hidden =
    !deferredPrompt ||
    runningInstalled ||
    installedThisSession;

  if (runningInstalled) {
    message.textContent = "Estás usando la aplicación en modo instalado.";
  } else if (installedThisSession) {
    message.textContent =
      "Aplicación instalada. Ábrela desde su ícono.";
  } else if (deferredPrompt) {
    message.textContent =
      "Puedes instalar ProyectosODS en tu dispositivo.";
  } else if (isIOS()) {
    message.textContent =
      "Para instalarla en iPhone o iPad, abre el menú Compartir y selecciona Agregar a pantalla de inicio. Si no aparece, prueba desde Safari.";
  } else {
    message.textContent =
      "La instalación desde este botón no está disponible por ahora. Revisa el menú del navegador para buscar Instalar app o Agregar a pantalla de inicio. Puedes seguir usando todas las funciones desde aquí.";
  }
}

export async function promptInstall() {
  if (
    !deferredPrompt ||
    isRunningInstalled() ||
    installedThisSession
  ) {
    updateInstallUI();
    return;
  }

  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  updateInstallUI();

  try {
    await promptEvent.prompt();

    const choice = await promptEvent.userChoice;

    console.log("[PWA] Resultado de instalación:", choice.outcome);
  } catch (error) {
    console.error("[PWA] No se pudo mostrar la instalación:", error);
  } finally {
    updateInstallUI();
  }
}

export function initializeInstall() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installedThisSession = false;
    updateInstallUI();

    console.log("[PWA] Evento de instalación guardado.");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installedThisSession = true;
    updateInstallUI();

    console.log("[PWA] Aplicación instalada.");
  });

  standaloneMedia.addEventListener("change", updateInstallUI);

  window.addEventListener("pageshow", updateInstallUI);

  document
    .getElementById("installAppButton")
    ?.addEventListener("click", promptInstall);

  updateInstallUI();
}