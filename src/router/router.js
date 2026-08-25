/**
 * Router — enrutador de cliente basado en la History API.
 *
 * Estado actual: SOLO soporta rutas EXACTAS (route.path === path).
 * TODO (Ejercicio - Parte A, punto 1): agrega soporte para rutas con
 * parámetros, como "/item/:id", dentro de matchRoute().
 */
export default class Router {
  constructor(routes, rootElement) {
    this.routes = routes;
    this.root = rootElement;

    window.addEventListener("popstate", () => this.render());

    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-link]");
      if (!link) return;
      event.preventDefault();
      this.navigate(link.getAttribute("href"));
    });
  }

  navigate(path) {
    window.history.pushState({}, "", path);
    this.render();
  }

  /**
   * Debe devolver { route, params } si alguna ruta coincide con "path",
   * o null si ninguna coincide.
   *
   * Ahora mismo SOLO compara de forma exacta, por lo que "/item/1" no
   * hace match con la ruta definida como "/item/:id".
   *
   * TODO: soporta segmentos dinámicos (":id") y regresa también los
   * parámetros capturados, ej:
   *   matchRoute("/item/2") -> { route: <ruta /item/:id>, params: { id: "2" } }
   */
  matchRoute(path) {
    for (const route of this.routes) {
      // Coincidencia exacta (ej: "/", "/acerca")
      if (route.path === path) {
        return { route, params: {} };
      }

      // Coincidencia dinámica (ej: "/item/:id")
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

  async render() {
    const path = window.location.pathname;
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
    document.title = `Red Social Académica — ${path}`;
  }

  init() {
    this.render();
  }
}
