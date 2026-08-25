// TODO (Ejercicio - Parte A, punto 2): completa esta vista.
//
// Esta función recibirá el objeto "params" que tu Router extraiga de la
// URL, por ejemplo params = { id: "2" } para la ruta "/item/2".
//
// Pasos sugeridos:
//   1. Dentro de esta función (NO como import estático arriba del
//      archivo), haz: const { default: ItemsService } = await
//      import("../services/itemsService.js");
//   2. Crea una instancia: const service = new ItemsService();
//   3. Usa service.getById(params.id) para obtener el elemento.
//   4. Si no existe, devuelve un HTML simple indicando "no encontrado".
//   5. Si existe, devuelve un <div class="card"> con sus campos
//      (título, descripción, meta...).
//
// TODO: una vez que funcione, ajusta qué campos mostrar y cómo
// se llaman en pantalla, según tu tema.

export default async function PublicationDetailView(params) {
  // 1. Importación dinámica del servicio dentro de la vista
  const { default: PublicationsService } = await import(
    "../services/itemsService.js"
  );

  // 2. Instancia del servicio y búsqueda del elemento por su ID
  const service = new PublicationsService();
  const publication = await service.getById(params?.id);

  // 3. Manejo de elemento no encontrado
  if (!publication) {
    return `
      <div class="card">
        <h2>Proyecto no encontrado</h2>
        <p>No se encontró ningún proyecto con el identificador <code>${params?.id ?? "desconocido"}</code>.</p>
        <p><a href="/" data-link>← Volver al inicio</a></p>
      </div>
    `;
  }

  // 4. Renderizado de los datos del proyecto
  return `
    <article class="card">
      <p><a href="/" data-link>← Volver a proyectos</a></p>
      <h2>${publication.title}</h2>
      <p class="status-badge"><strong>Estado:</strong> ${publication.status} (${publication.progress}% avance)</p>
      
      <section>
        <h3>Descripción</h3>
        <p>${publication.description}</p>
      </section>

      <section>
        <h3>Problemática</h3>
        <p>${publication.problem}</p>
      </section>

      <section>
        <h3>Objetivo general</h3>
        <p>${publication.objective}</p>
      </section>

      <section>
        <h3>ODS Vinculados</h3>
        <ul>
          ${publication.ods.map((odsItem) => `<li>${odsItem}</li>`).join("")}
        </ul>
      </section>

      <section>
        <h3>Información del equipo</h3>
        <p><strong>Responsable:</strong> ${publication.creator}</p>
        <p><strong>Integrantes actuales:</strong> ${publication.members}</p>
      </section>

      <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #e5e7eb;" />
      <a href="/" data-link>← Volver al catálogo de proyectos</a>
    </article>
  `;
}

