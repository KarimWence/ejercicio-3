// views/NotFoundView.js
export default function NotFoundView() {
  return `
    <div class="card empty-card">
      <p class="hero__eyebrow">Error 404</p>
      <h2>Pagina no encontrada</h2>
      <p>La ruta a la que intentas acceder no existe en la aplicacion.</p>
      <p><a href="/" data-link class="btn-link">← Volver al inicio</a></p>
    </div>
  `;
}