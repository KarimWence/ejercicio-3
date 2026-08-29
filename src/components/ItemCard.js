import { slugify } from "../utils/slugify.js";

// Recibe un objeto de publicacion/proyecto y genera el HTML de su tarjeta
export default function PublicationCard(publication) {
  const slug = slugify(publication.title);

  return `
    <article class="card" data-slug="${slug}">
      <header class="card-header">
        <span class="status-badge">${publication.status}</span>
      </header>
      <h3>${publication.title}</h3>
      <p class="card-desc">${publication.description}</p>
      <p class="card-ods"><strong>ODS:</strong> ${publication.ods.join(", ")}</p>
      <div class="card-footer">
        <small class="card-meta">Creado por: ${publication.creator} · ${publication.members} integrantes</small>
        <a href="/item/${publication.id}" data-link class="card-link">Ver proyecto →</a>
      </div>
    </article>
  `;
}
