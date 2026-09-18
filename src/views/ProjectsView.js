import {
  getFavoriteProjects,
  getFavoriteProjectsByCategory,
} from "../services/dbService.js";

let selectedCategory = "";

export function setCategoryFilter(category) {
  selectedCategory = category;
}

export default async function ProjectsView() {
  let projects = [];

  if (selectedCategory) {
    projects = await getFavoriteProjectsByCategory(selectedCategory);
  } else {
    projects = await getFavoriteProjects();
  }

  return `
    <header class="hero">
      <p class="hero__eyebrow">Administración</p>

      <h2 class="hero__title">
        Registro de proyectos
      </h2>

      <p class="hero__subtitle">
        Agrega y consulta proyectos de impacto social.
      </p>
    </header>

    <form id="project-form" class="project-form">
      <div class="form-group">
        <label for="project-title">
          Nombre del proyecto
        </label>

        <input
          id="project-title"
          name="title"
          type="text"
          placeholder="Ejemplo: Huerto comunitario"
          required
        />
      </div>

      <div class="form-group">
        <label for="project-category">
          Categoría
        </label>

        <select
          id="project-category"
          name="category"
          required
        >
          <option value="">
            Selecciona una categoría
          </option>

          <option value="Educación">
            Educación
          </option>

          <option value="Medio ambiente">
            Medio ambiente
          </option>

          <option value="Participación ciudadana">
            Participación ciudadana
          </option>

          <option value="Salud">
            Salud
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="project-description">
          Descripción
        </label>

        <textarea
          id="project-description"
          name="description"
          rows="4"
          placeholder="Describe brevemente el proyecto"
          required
        ></textarea>
      </div>

      <button type="submit">
        Agregar proyecto
      </button>
    </form>

    <section class="projects-section">
      <div class="projects-section__header">
        <div>
          <p class="hero__eyebrow">
            Contenido actual
          </p>

          <h2 class="projects-section__title">
            Proyectos guardados
          </h2>
        </div>

        <div class="filter-group">
          <label for="category-filter">
            Filtrar por categoría
          </label>

          <select id="category-filter">
            <option value="" ${selectedCategory === "" ? "selected" : ""}>
              Todas las categorías
            </option>

            <option
              value="Educación"
              ${selectedCategory === "Educación" ? "selected" : ""}
            >
              Educación
            </option>

            <option
              value="Medio ambiente"
              ${selectedCategory === "Medio ambiente" ? "selected" : ""}
            >
              Medio ambiente
            </option>

            <option
              value="Participación ciudadana"
              ${selectedCategory === "Participación ciudadana" ? "selected" : ""}
            >
              Participación ciudadana
            </option>

            <option
              value="Salud"
              ${selectedCategory === "Salud" ? "selected" : ""}
            >
              Salud
            </option>
          </select>
        </div>
      </div>

      ${
        projects.length > 0
          ? `
            <div class="projects-list">
              ${projects
                .map(
                  (project) => `
                    <article class="project-record">
                      <span class="project-record__category">
                        ${project.category}
                      </span>

                      <h3>${project.title}</h3>

                      <p>${project.description}</p>

                      <div class="project-record__footer">
                        <button
                          type="button"
                          class="delete-project-button"
                          data-delete-project="${project.id}"
                        >
                          Eliminar proyecto
                        </button>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>
          `
          : `
            <div class="projects-empty">
              <p>
                No hay proyectos guardados en esta categoría.
              </p>
            </div>
          `
      }
    </section>
  `;
}