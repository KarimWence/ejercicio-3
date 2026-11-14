// Directorio desde el que se sirve la aplicacion, por ejemplo "/" o "/ejercicio-3/".
export const BASE_PATH = new URL(".", document.baseURI).pathname;

// En local se deja vacío para usar el mismo servidor de la app. Al desplegar
// el backend, se sustituye por su origen HTTPS, sin barra final.
export const BACKEND_URL = "";

export function withBasePath(path) {
	return `${BASE_PATH}${path.replace(/^\/+/, "")}`;
}

export function withBackendUrl(path) {
  const normalizedPath = path.replace(/^\/+/, "");

  if (!BACKEND_URL) {
    return withBasePath(normalizedPath);
  }

  return new URL(normalizedPath, `${BACKEND_URL}/`).href;
}
