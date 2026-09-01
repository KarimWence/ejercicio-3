// views/NewsView.js
import ApiService from "../services/apiService.js";

export default async function NewsView() {
  const api = new ApiService();

  // 1. Estado Cargando: Se muestra el skeleton antes de resolver la peticion
  let contentHtml = "";

  try {
    // 2. Llamada asincrona al servicio con async/await
    const articles = await api.getNews(9);

    if (!articles || articles.length === 0) {
      contentHtml = `
        <div class="empty-card">
          <p>No se encontraron noticias disponibles en este momento.</p>
        </div>
      `;
    } else {
      // 3. Estado Exito: Transformacion de datos en tarjetas del DOM usando .map()
      const cardsHtml = articles
        .map((article) => {
          const formattedDate = new Date(article.published_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

          return `
            <article class="card news-card">
              ${
                article.image_url
                  ? `<img src="${article.image_url}" alt="${article.title}" class="news-card__image" loading="lazy" />`
                  : ""
              }
              <div class="news-card__body">
                <header class="card-header">
                  <span class="status-badge">${article.news_site || "Ciencia"}</span>
                  <small class="card-meta">${formattedDate}</small>
                </header>
                <h3>${article.title}</h3>
                <p class="card-desc">${article.summary || "Sin descripcion disponible."}</p>
                <div class="card-footer">
                  <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="card-link">
                    Leer articulo completo →
                  </a>
                </div>
              </div>
            </article>
          `;
        })
        .join("");

      contentHtml = `
        <div class="grid">
          ${cardsHtml}
        </div>
      `;
    }
  } catch (error) {
  contentHtml = `
    <section class="error-card" role="alert">
      <div class="error-card__icon" aria-hidden="true">!</div>

      <div class="error-card__content">
        <p class="error-card__eyebrow">Error de conexión</p>

        <h2>No pudimos cargar las noticias</h2>

        <p class="error-card__message">
          Parece que hubo un problema al comunicarnos con el servicio.
          Comprueba tu conexión e inténtalo nuevamente.
        </p>

        <details class="error-card__details">
          <summary>Ver detalles técnicos</summary>
          <code>${error.message}</code>
        </details>

        <a href="/noticias" data-link class="error-card__button">
          Intentar de nuevo
        </a>
      </div>
    </section>
  `;
}
  return `
    <header class="hero">
      <p class="hero__eyebrow">Actualidad Cientifica</p>
      <h2 class="hero__title">Noticias de Ciencia y Tecnologia</h2>
      <p class="hero__subtitle">
        Articulos obtenidos en tiempo real desde una API REST publica externa.
      </p>
    </header>

    ${contentHtml}
  `;
}
