// Directorio desde el que se sirve la aplicacion, por ejemplo "/" o "/ejercicio-3/".
export const BASE_PATH = new URL(".", document.baseURI).pathname;

export function withBasePath(path) {
	return `${BASE_PATH}${path.replace(/^\/+/, "")}`;
}