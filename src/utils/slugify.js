export function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // quita símbolos
    .replace(/\s+/g, "-") // espacios - guiones
    .replace(/-+/g, "-"); // colapsa guiones repetidos
}
