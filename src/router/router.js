// router/router.js
// Enrutador de cliente basado en la History API.
// Conecta el App Shell con el contenido dinamico: SOLO modifica el contenedor root (#app).

export default class Router {
  constructor(routes, rootElement) {
    this.routes = routes;
    this.root = rootElement;

    // Escucha la navegacion de atras/adelante del navegador
    window.addEventListener("popstate", () => this.render());

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
    if (path === window.location.pathname) return;
    window.history.pushState({}, "", path);
    this.render();
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
  get skeletonHTML() {
    return `
      <div class="skeleton">
        <div class="skeleton__line skeleton__line--title"></div>
        <div class="skeleton__line skeleton__line--wide"></div>
        <div class="skeleton__line" style="width: 40%"></div>
        <div class="skeleton__grid">
          <div class="skeleton__card"></div>
          <div class="skeleton__card"></div>
          <div class="skeleton__card"></div>
        </div>
      </div>
    `;
  }

  async render() {
    const path = window.location.pathname;

    // Mostrar skeleton inmediatamente dentro de #app
    this.root.innerHTML = this.skeletonHTML;

    const match = this.matchRoute(path);

    if (!match) {
      const { default: NotFoundView } = await import(
        "../views/NotFoundView.js"
      );
      this.root.innerHTML = NotFoundView();
      return;
    }

    const html = await match.route.view(match.params);
    this.root.innerHTML = html;
    document.title = `Red Social Academica - ${path}`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  init() {
    this.render();
  }
}
