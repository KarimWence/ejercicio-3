import PublicationCard from "../components/ItemCard.js";

import {
  getFavoriteProjects,
} from "../services/dbService.js";

export default async function FavoritesView() {
  const favoriteProjects = await getFavoriteProjects();

  return `
    <header class="hero">
      <p class="hero__eyebrow">Colección personal</p>

      <h2 class="hero__title">Proyectos favoritos</h2>

      <p class="hero__subtitle">
        Proyectos que guardaste para consultarlos posteriormente.
      </p>
    </header>

    ${
      favoriteProjects.length > 0
        ? `
          <div class="grid">
            ${favoriteProjects
              .map(
                (project) => `
                  <div class="favorite-card" data-favorite-card="${project.id}">
                    ${PublicationCard(project)}

                    <button
                      type="button"
                      class="btn-delete-favorite"
                      data-delete-favorite="${project.id}"
                      aria-label="Eliminar ${project.title} de favoritos"
                    >
                      Eliminar de favoritos
                    </button>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : `
          <div class="favorites-empty">
            <span class="favorites-empty__icon">☆</span>

            <h3>No tienes proyectos favoritos</h3>

            <p>
              Visita el catálogo y agrega los proyectos que te interesen.
            </p>

            <a href="/" data-link class="btn-link">
              Ver proyectos
            </a>
          </div>
        `
    }
  `;
}