import { getCookie } from "../services/cookieService.js";

function getStorageValue(value) {
  return value === null || value === "" ? "Sin valor guardado" : value;
}

export default function DiagnosticsView() {
  const theme = localStorage.getItem("app-theme");
  const newsSearch = sessionStorage.getItem("newsSearch");
  const visits = getCookie("appVisits");

  return `
    <section class="hero">
      <p class="hero__eyebrow">Diagnóstico</p>
      <h2 class="hero__title">Estado de almacenamiento</h2>
      <p class="hero__subtitle">
        Consulta y limpia individualmente los datos guardados por la aplicación.
      </p>
    </section>

    <section class="diagnostics-grid">
      <article class="card diagnostic-card">
        <h3>localStorage</h3>
        <p><strong>Tema:</strong> ${getStorageValue(theme)}</p>
        <button class="diagnostic-button" data-clear-storage="local">
          Limpiar localStorage
        </button>
      </article>

      <article class="card diagnostic-card">
        <h3>sessionStorage</h3>
        <p><strong>Búsqueda:</strong> ${getStorageValue(newsSearch)}</p>
        <button class="diagnostic-button" data-clear-storage="session">
          Limpiar sessionStorage
        </button>
      </article>

      <article class="card diagnostic-card">
        <h3>Cookie</h3>
        <p><strong>Visitas:</strong> ${getStorageValue(visits)}</p>
        <button class="diagnostic-button" data-clear-storage="cookie">
          Limpiar cookie
        </button>
      </article>
    </section>
  `;
}