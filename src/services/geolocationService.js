const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000,
};

const UNBLOCK_MESSAGE =
  "Para habilitarla, abre el icono de controles o candado junto " +
  "a la dirección → Configuración del sitio → Ubicación → Permitir. " +
  "Después, recarga la página.";

let permissionStatus = null;
let fallbackState = "unavailable";

function notifyPermissionChange() {
  window.dispatchEvent(new Event("location-permission-change"));
}

function getLocationErrorMessage(error) {
  switch (error.code) {
    case 1:
      return `El acceso a tu ubicación está bloqueado. ${UNBLOCK_MESSAGE}`;
    case 2:
      return "No fue posible determinar tu ubicación en este momento.";
    case 3:
      return "La ubicación tardó demasiado en responder. Inténtalo de nuevo.";
    default:
      return "Ocurrió un problema al solicitar tu ubicación.";
  }
}

/** Consulta el estado sin solicitar acceso a la ubicación. */
export async function getLocationPermissionState() {
  if (!navigator.geolocation || !window.isSecureContext) {
    return "unavailable";
  }

  if (permissionStatus) {
    return permissionStatus.state;
  }

  if (navigator.permissions?.query) {
    try {
      permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });

      permissionStatus.addEventListener("change", () => {
        fallbackState = permissionStatus.state;
        notifyPermissionChange();
      });

      return permissionStatus.state;
    } catch {
      // Algunos navegadores no permiten consultar este permiso.
    }
  }

  return fallbackState;
}

/** Llamar únicamente como consecuencia de un clic del usuario. */
export async function getCurrentLocation() {
  if (!navigator.geolocation) {
    throw new Error(
      "Tu navegador no permite consultar la ubicación del dispositivo."
    );
  }

  if (!window.isSecureContext) {
    throw new Error("La ubicación requiere HTTPS o localhost.");
  }

  const state = await getLocationPermissionState();

  // También protege al botón existente de la vista Colaborar.
  if (state === "denied") {
    throw new Error(`La ubicación está bloqueada. ${UNBLOCK_MESSAGE}`);
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fallbackState = "granted";
        notifyPermissionChange();

        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // Un timeout o una ubicación no disponible no significan denegación.
        if (error.code === 1) {
          fallbackState = "denied";
        }

        notifyPermissionChange();

        const locationError = new Error(getLocationErrorMessage(error));
        locationError.code = error.code;
        reject(locationError);
      },
      GEOLOCATION_OPTIONS
    );
  });
}

/** Inicializa el control fijo del App Shell. */
export function initializeLocationPermission() {
  const button = document.getElementById("locationPermissionButton");
  const message = document.getElementById("locationPermissionMessage");

  if (!button || !message) return;

  let busy = false;
  let renderVersion = 0;

  async function render() {
    const version = ++renderVersion;
    const state = await getLocationPermissionState();

    if (version !== renderVersion) return;

    const supported =
      Boolean(navigator.geolocation) && window.isSecureContext;

    const labels = {
      prompt: "Ubicación: default · Solicitar",
      granted: "Ubicación: granted · Permitida",
      denied: "Ubicación: denied · Bloqueada",
      unavailable: "Ubicación: estado no disponible",
    };

    button.dataset.state = state === "prompt" ? "default" : state;
    button.textContent = busy
      ? "Solicitando ubicación…"
      : labels[state] ?? labels.unavailable;

    button.disabled =
      busy || !supported || state === "denied" || state === "granted";

    if (!supported) {
      message.textContent =
        "La ubicación requiere un navegador compatible y HTTPS o localhost.";
    } else if (state === "denied") {
      message.textContent = UNBLOCK_MESSAGE;
    } else if (state === "granted") {
      message.textContent = "El acceso a tu ubicación está permitido.";
    } else if (state === "prompt") {
      message.textContent = "Pulsa el botón para solicitar el permiso.";
    } else {
      // No inventamos un estado default si no se puede consultar.
      button.textContent = busy
        ? "Solicitando ubicación…"
        : "Solicitar ubicación";
      message.textContent =
        "Este navegador no permite consultar el estado del permiso.";
    }
  }

  button.addEventListener("click", async () => {
    if (busy) return;

    busy = true;
    button.disabled = true;
    button.textContent = "Solicitando ubicación…";

    let requestError = null;

    try {
      await getCurrentLocation();
    } catch (error) {
      requestError = error;
    } finally {
      busy = false;
      await render();

      if (requestError) {
        message.textContent = requestError.message;
      }
    }
  });

  window.addEventListener("location-permission-change", render);
  window.addEventListener("focus", render);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });

  render();
}