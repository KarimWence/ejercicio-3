// utils/slugify.js
// Funcion para convertir un texto a slug limpio para URLs e IDs

export function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // quita simbolos
    .replace(/\s+/g, "-") // espacios a guiones
    .replace(/-+/g, "-"); // colapsa guiones repetidos
}

export default slugify;