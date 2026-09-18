import PublicationCard from "../components/ItemCard.js";

import {
  getFavoriteProjects,
  getFavoriteProjectsByCategory,
} from "../services/dbService.js";

const PROJECT_CATEGORIES = [
  "Educación",
  "Medio ambiente",
  "Participación ciudadana",
  "Salud",
];

let selectedCategory = "";

export function setFavoritesCategory(category) {
  selectedCategory = category;
}

export default async function FavoritesView() {
  const favoriteProjects = selectedCategory
    ? await getFavoriteProjectsByCategory(selectedCategory)
    : await getFavoriteProjects();

  const categoryOptions = PROJECT_CATEGORIES.map(
    (category) => `
      <option value="${category}" ${
        selectedCategory === category ? "selected" : ""
      }>
        ${category}
      </option>
    `
  ).join("");

  return `
    <header class="hero">
      <p class="hero__eyebrow">Colección personal</p>

      <h2 class="hero__title">Proyectos favoritos</h2>

      <p class="hero__subtitle">
        Proyectos que guardaste para consultarlos posteriormente.
      </p>
    </header>

    <div class="favorites-toolbar">
      <label for="favorites-category-filter">
        Filtrar por categoría
      </label>

      <select id="favorites-category-filter">
        <option value="" ${selectedCategory === "" ? "selected" : ""}>
          Todas las categorías
        </option>

        ${categoryOptions}
      </select>
    </div>

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

            <h3>${
              selectedCategory
                ? `No tienes favoritos de ${selectedCategory}`
                : "No tienes proyectos favoritos"
            }</h3>

            <p>
              ${
                selectedCategory
                  ? "Prueba con otra categoría o revisa todas tus categorías."
                  : "Visita el catálogo y agrega los proyectos que te interesen."
              }
            </p>

            ${
              selectedCategory
                ? ""
                : `
                  <a href="#/" data-link class="btn-link">
                    Ver proyectos
                  </a>
                `
            }
          </div>
        `
    }
  `;
}