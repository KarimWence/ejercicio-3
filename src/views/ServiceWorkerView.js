function getCurrentWorker(registration) {
  if (!registration) {
    return null;
  }

  return (
    registration.installing ||
    registration.waiting ||
    registration.active ||
    null
  );
}


function translateWorkerState(worker) {
  if (!worker) {
    return "No disponible";
  }

  const states = {
    installing: "Instalando",
    installed: "Instalado",
    activating: "Activando",
    activated: "Activado",
    redundant: "Redundante",
  };

  return states[worker.state] || worker.state;
}


function createDiagnosticRow(label, value, status) {
  return `
    <div class="worker-diagnostic-row">
      <span class="worker-diagnostic-label">
        ${label}
      </span>

      <span
        class="
          worker-diagnostic-value
          worker-diagnostic-value--${status}
        "
      >
        ${value}
      </span>
    </div>
  `;
}


/*
 * Comprueba si una dirección pertenece al scope.
 */
function isRouteInsideScope(route, scope) {
  if (!scope) {
    return false;
  }

  try {
    const routeUrl = new URL(
      route,
      window.location.origin
    );

    const scopeUrl = new URL(scope);

    /*
     * Primero verifica que las dos direcciones
     * pertenezcan al mismo origen.
     */
    const sameOrigin =
      routeUrl.origin === scopeUrl.origin;

    /*
     * Después comprueba que la ruta comience
     * con la ruta establecida en el scope.
     */
    const pathInsideScope =
      routeUrl.pathname.startsWith(
        scopeUrl.pathname
      );

    return sameOrigin && pathInsideScope;
  } catch (error) {
    console.error(
      "No se pudo verificar la ruta:",
      route,
      error
    );

    return false;
  }
}


/*
 * Crea un renglón de la tabla del scope.
 */
function createScopeRow(routeData, scope) {
  const insideScope = isRouteInsideScope(
    routeData.url,
    scope
  );

  return `
    <tr>
      <td>${routeData.type}</td>

      <td>
        <code>${routeData.display}</code>
      </td>

      <td>
        <span
          class="
            scope-result
            ${
              insideScope
                ? "scope-result--inside"
                : "scope-result--outside"
            }
          "
        >
          ${
            insideScope
              ? "Dentro del scope"
              : "Fuera del scope"
          }
        </span>
      </td>
    </tr>
  `;
}


/*
 * Crea la tabla completa con las rutas solicitadas.
 */
function createScopeTable(scope) {
  const projectRootWithoutSlash =
    window.location.origin;

  const routes = [
    {
      type: "Raíz del proyecto",
      url: "/",
      display: "/",
    },
    {
      type: "Ruta del router",
      url: "/service-worker",
      display: "/service-worker",
    },
    {
      type: "Archivo interno",
      url: "/src/main.js",
      display: "/src/main.js",
    },
    {
      type: "Raíz sin diagonal final",
      url: projectRootWithoutSlash,
      display: projectRootWithoutSlash,
    },
    {
      type: "Ruta fuera del proyecto",
      url: "https://example.com/fuera-del-proyecto",
      display: "https://example.com/fuera-del-proyecto",
    },
  ];

  return `
    <div class="scope-table-container">
      <table class="scope-table">
        <thead>
          <tr>
            <th>Tipo de ruta</th>
            <th>Dirección verificada</th>
            <th>Resultado</th>
          </tr>
        </thead>

        <tbody>
          ${routes
            .map((route) =>
              createScopeRow(route, scope)
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}


export default async function ServiceWorkerView() {
  const supportsServiceWorker =
    "serviceWorker" in navigator;

  const secureContext =
    window.isSecureContext;

  let registration = null;

  if (supportsServiceWorker) {
    registration =
      await navigator.serviceWorker.getRegistration();
  }

  const worker =
    getCurrentWorker(registration);

  const controlsPage =
    supportsServiceWorker &&
    navigator.serviceWorker.controller !== null;

  const scope =
    registration?.scope || null;

  return `
    <section class="hero">
      <p class="hero__eyebrow">
        Service Worker
      </p>

      <h2 class="hero__title">
        Diagnóstico del Service Worker
      </h2>

      <p class="hero__subtitle">
        Consulta el registro, estado y alcance
        actual del Service Worker.
      </p>
    </section>


    <section class="card worker-diagnostic-card">
      <div class="worker-diagnostic-list">

        ${createDiagnosticRow(
          "¿El navegador soporta Service Workers?",
          supportsServiceWorker ? "Sí" : "No",
          supportsServiceWorker
            ? "success"
            : "error"
        )}

        ${createDiagnosticRow(
          "¿Contexto seguro?",
          secureContext ? "Sí" : "No",
          secureContext
            ? "success"
            : "error"
        )}

        ${createDiagnosticRow(
          "¿Service Worker registrado?",
          registration ? "Sí" : "No",
          registration
            ? "success"
            : "error"
        )}

        ${createDiagnosticRow(
          "Scope",
          scope || "No disponible",
          registration
            ? "information"
            : "inactive"
        )}

        ${createDiagnosticRow(
          "URL del script",
          worker?.scriptURL || "No disponible",
          worker
            ? "information"
            : "inactive"
        )}

        ${createDiagnosticRow(
          "Estado del worker",
          translateWorkerState(worker),
          worker?.state === "activated"
            ? "success"
            : "inactive"
        )}

        ${createDiagnosticRow(
          "¿Controla esta página?",
          controlsPage ? "Sí" : "No",
          controlsPage
            ? "success"
            : "inactive"
        )}

      </div>

      <button
        type="button"
        class="diagnostic-button"
        data-refresh-worker
      >
        Actualizar estado
      </button>
    </section>


    <section class="scope-section">
      <div class="scope-section__header">
        <p class="hero__eyebrow">
          Verificador
        </p>

        <h3>
          Verificador de scope
        </h3>

        <p>
          La tabla compara diferentes direcciones
          con el scope registrado del Service Worker.
        </p>
      </div>

      ${
        scope
          ? createScopeTable(scope)
          : `
            <div class="card scope-empty">
              No existe un Service Worker registrado.
              Presiona “Actualizar estado” para
              consultar nuevamente.
            </div>
          `
      }
    </section>
  `;
}