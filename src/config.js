// Directorio desde el que se sirve la aplicacion, por ejemplo "/" o "/ejercicio-3/".
export const BASE_PATH = new URL(".", document.baseURI).pathname;

// Origen HTTPS del backend desplegado. No es un secreto y no debe incluir
// rutas como /api ni una barra final.
export const BACKEND_URL = "https://proyectosods-api.onrender.com";

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
