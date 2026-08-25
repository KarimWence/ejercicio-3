import { slugify } from "../utils/slugify.js";

// Recibe un objeto "item" y devuelve el HTML de su tarjeta en el listado.
// TODO: ajusta qué campos mostrar según tu tema, si lo deseas
// (por ejemplo, mostrar "meta" como "Duración:", "Precio:", etc.)
export default function PublicationCard(publication) {
  // TODO (Ejercicio - Parte A, punto 3): usa slugify(item.title) para
  // llenar el atributo data-slug de abajo (actualmente queda sin procesar).
  const slug = slugify(publication.title);

  return `
    <article class="card" data-slug="${slug}">
    <h3>${publication.title}</h3>
    <p>${publication.description}</p>
    <p><strong>ODS:</strong> ${publication.ods.join(", ")}</p>
    <p><strong>Estado:</strong> ${publication.status}</p>
    <p><small>Creado por: ${publication.creator} · ${publication.members} integrantes</small></p>
    <a href="/item/${publication.id}" data-link>Ver proyecto →</a>
  </article>
  `;
}
