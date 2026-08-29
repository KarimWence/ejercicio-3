// components/Skeleton.js
// Elemento de carga temporal que se monta en el App Shell
// mientras el router descarga y resuelve la vista solicitada.

export function createSkeleton() {
  const container = document.createElement("div");
  container.className = "skeleton";
  container.setAttribute("role", "status");
  container.setAttribute("aria-label", "Cargando contenido");

  container.innerHTML = `
    <div class="skeleton__line skeleton__line--title"></div>
    <div class="skeleton__line skeleton__line--wide"></div>
    <div class="skeleton__line" style="width: 40%"></div>
    <div class="skeleton__grid">
      <div class="skeleton__card"></div>
      <div class="skeleton__card"></div>
      <div class="skeleton__card"></div>
    </div>
  `;

  return container;
}
