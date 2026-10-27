const GEOLOCATION_OPTIONS = {
  // Una zona aproximada basta para coordinar colaboración: ahorra batería,
  // evita una espera indefinida y permite reutilizar una lectura reciente.
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000,
};

function getLocationErrorMessage(error) {
  switch (error.code) {
    case 1:
      return "No autorizaste el acceso a tu ubicación. Puedes habilitarlo desde el icono de candado junto a la dirección del sitio y volver a intentarlo.";
    case 2:
      return "No fue posible determinar tu ubicación en este momento.";
    case 3:
      return "La ubicación tardó demasiado en responder. Inténtalo de nuevo.";
    default:
      return "Ocurrió un problema al solicitar tu ubicación.";
  }
}

/**
 * Solicita una ubicación puntual. Debe llamarse únicamente desde una acción
 * explícita del usuario para que el navegador pueda mostrar el permiso.
 */
export function getCurrentLocation() {
  if (!("geolocation" in navigator)) {
    return Promise.reject(
      new Error("Tu navegador no permite consultar la ubicación del dispositivo.")
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => reject(new Error(getLocationErrorMessage(error))),
      GEOLOCATION_OPTIONS
    );
  });
}

/** Consulta el permiso sin disparar el diálogo de ubicación. */
export async function getLocationPermissionState() {
  if (!("permissions" in navigator) || !navigator.permissions.query) {
    return "unavailable";
  }

  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state;
  } catch (error) {
    return "unavailable";
  }
}
