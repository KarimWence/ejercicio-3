// views/ItemDetailView.js
// Renderiza el detalle de una publicacion de forma asincrona
// importando dinamicamente itemsService.js

export default async function PublicationDetailView(params) {
  // Importacion dinamica del servicio bajo demanda
  const { default: PublicationsService } = await import(
    "../services/itemsService.js"
  );

  const service = new PublicationsService();
  const publication = await service.getById(params?.id);

  if (!publication) {
    return `
      <div class="card empty-card">
        <h2>Proyecto no encontrado</h2>
        <p>No se encontro ningun proyecto con el identificador <code>${params?.id ?? "desconocido"}</code>.</p>
        <p><a href="/" data-link class="btn-link">← Volver al inicio</a></p>
      </div>
    `;
  }

  return `
    <article class="card detail-card">
      <a href="/" data-link class="btn-back">← Volver al catalogo</a>
      
      <header class="detail-header">
        <span class="status-badge">${publication.status} · ${publication.progress}% avance</span>
        <h2>${publication.title}</h2>
      </header>

      <div class="detail-grid">
        <div class="detail-main">
          <section>
            <h3>Descripcion</h3>
            <p>${publication.description}</p>
          </section>

          <section>
            <h3>Problematica</h3>
            <p>${publication.problem}</p>
          </section>

          <section>
            <h3>Objetivo general</h3>
            <p>${publication.objective}</p>
          </section>

          <section>
            <h3>ODS Vinculados</h3>
            <ul class="ods-list">
              ${publication.ods.map((odsItem) => `<li>${odsItem}</li>`).join("")}
            </ul>
          </section>
        </div>

        <aside class="detail-side">
          <h3>Informacion del equipo</h3>
          <dl class="detail-facts">
            <dt>Responsable</dt>
            <dd>${publication.creator}</dd>
            <dt>Integrantes actuales</dt>
            <dd>${publication.members} personas</dd>
            <dt>Avance del proyecto</dt>
            <dd>${publication.progress}%</dd>
          </dl>
        </aside>
      </div>

      <footer class="detail-footer">
        <a href="/" data-link class="btn-link">← Volver a proyectos</a>
      </footer>
    </article>
  `;
}