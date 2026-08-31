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
    // 4. Estado Error: Mensaje visible si la peticion a la API falla
    contentHtml = `
      <div class="card error-card">
        <p class="hero__eyebrow">Error de conexion</p>
        <h2>No se pudieron cargar las noticias</h2>
        <p>Ocurrio un problema al conectar con la API REST externa: <code>${error.message}</code></p>
        <p><a href="/noticias" data-link class="btn-link">Intentar de nuevo</a></p>
      </div>
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
