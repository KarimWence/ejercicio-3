// router/router.js
// Enrutador de cliente basado en la History API.
// Conecta el App Shell con el contenido dinamico: SOLO modifica el contenedor root (#app).

import { createSkeleton } from "../components/Skeleton.js";


export default class Router {
  constructor(routes, rootElement) {
    this.routes = routes;
    this.root = rootElement;

    // Escucha la navegacion de atras/adelante del navegador
    window.addEventListener("popstate", () => this.render());
    window.addEventListener("hashchange", () => this.render());

    // Intercepta clics en enlaces internos marcados con data-link
    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-link]");
      if (!link) return;
      event.preventDefault();
      this.navigate(link.getAttribute("href"));
    });
  }

  // Navega a una ruta sin recargar la pagina
  navigate(path) {
    const normalizedPath = path.replace(/^#/, "").replace(/\/+$/, "") || "/";

    // Si estamos en la misma página, vuelve a cargar su contenido
    if (normalizedPath === this.getCurrentPath()) {
      this.render();
      return;
    }

    window.location.hash = normalizedPath;
  }

  getCurrentPath() {
    const hashPath = window.location.hash.slice(1);

    if (hashPath) {
      return hashPath.replace(/\/+$/, "") || "/";
    }

    return window.location.pathname.replace(/\/+$/, "") || "/";
  }

  // Compara la ruta actual con las rutas registradas (soporta :id)
  matchRoute(path) {
    for (const route of this.routes) {
      // Coincidencia exacta (ej: "/", "/acerca")
      if (route.path === path) {
        return { route, params: {} };
      }

      // Coincidencia dinamica (ej: "/item/:id")
      const routeSegments = route.path.split("/").filter(Boolean);
      const pathSegments = path.split("/").filter(Boolean);

      if (routeSegments.length !== pathSegments.length) {
        continue;
      }

      const params = {};
      let isMatch = true;

      for (let i = 0; i < routeSegments.length; i++) {
        const routeSegment = routeSegments[i];
        const pathSegment = pathSegments[i];

        if (routeSegment.startsWith(":")) {
          const paramName = routeSegment.slice(1);
          params[paramName] = decodeURIComponent(pathSegment);
        } else if (routeSegment !== pathSegment) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        return { route, params };
      }
    }

    return null;
  }

  // Skeleton de carga que se muestra mientras el router resuelve la vista


  async render(options = {}) {
    const {
        showSkeleton = true,
        scrollToTop = true,
    } = options;

    const path = this.getCurrentPath();

    if (showSkeleton) {
        this.root.replaceChildren(createSkeleton());
    }

    const match = this.matchRoute(path);

    if (!match) {
        const { default: NotFoundView } = await import(
            "../views/NotFoundView.js"
        );

        this.root.innerHTML = NotFoundView();
        return;
    }

    try {
      const html = await match.route.view(match.params);

      this.root.innerHTML = html;
    } catch (error) {
      console.error("No se pudo cargar la vista:", error);

      this.root.innerHTML = `
        <section class="favorites-empty">
          <h2>No se pudo cargar esta página</h2>
          <p>Recarga la página para intentarlo nuevamente.</p>
          <a href="#/" data-link class="btn-link">Volver al inicio</a>
        </section>
      `;
    }

    document.title = `Red Social Academica - ${path}`;

    if (scrollToTop) {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }
}

  init() {
    this.render();
  }
}

