/*
 * Obtiene el Service Worker disponible
 * dentro del registro.
 */
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


/*
 * Traduce el estado del Service Worker.
 */
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


/*
 * Crea un renglón del diagnóstico.
 */
function createDiagnosticRow(
  label,
  value,
  status
) {
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
 * Comprueba si una dirección pertenece
 * al scope del Service Worker.
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

    const sameOrigin =
      routeUrl.origin === scopeUrl.origin;

    const pathInsideScope =
      routeUrl.pathname.startsWith(
        scopeUrl.pathname
      );

    return (
      sameOrigin &&
      pathInsideScope
    );
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
      <td>
        ${routeData.type}
      </td>

      <td>
        <code>
          ${routeData.display}
        </code>
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
 * Crea la tabla completa con las rutas
 * solicitadas por la actividad.
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
      url: "https://github.com/KarimWence/ejercicio-3",
      display:
        "https://github.com/KarimWence/ejercicio-3",
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
              createScopeRow(
                route,
                scope
              )
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}


/*
 * Intenta registrar el Service Worker ubicado
 * dentro de /src/ utilizando el scope /.
 */
async function testInvalidScope() {
  const output = document.getElementById(
    "invalid-scope-result"
  );

  const button = document.querySelector(
    "[data-test-invalid-scope]"
  );

  if (!output || !button) {
    return;
  }

  const originalButtonContent =
    button.innerHTML;

  if (!("serviceWorker" in navigator)) {
    output.textContent =
      "El navegador no soporta Service Workers.";

    output.className =
      "invalid-scope-result invalid-scope-result--error";

    return;
  }

  button.disabled = true;

  button.innerHTML = `
    <span
      class="invalid-scope-button__spinner"
      aria-hidden="true"
    ></span>

    <span>
      Probando scope...
    </span>
  `;

  output.textContent =
    "Intentando registrar /src/sw.js con el scope /...";

  output.className =
    "invalid-scope-result invalid-scope-result--loading";

  try {
    const registration =
      await navigator.serviceWorker.register(
        "/src/sw.js",
        {
          scope: "/",
        }
      );

    /*
     * Si el servidor autorizó el scope,
     * eliminamos el registro experimental.
     */
    await registration.unregister();

    output.textContent =
      "El navegador aceptó el scope. Es posible que el servidor autorice scopes más amplios mediante Service-Worker-Allowed. El registro experimental fue eliminado.";

    output.className =
      "invalid-scope-result invalid-scope-result--warning";
  } catch (error) {
    /*
     * Este es el resultado esperado.
     */
    output.textContent =
      `Error esperado: ${error.name}: ${error.message}`;

    output.className =
      "invalid-scope-result invalid-scope-result--success";
  } finally {
    button.disabled = false;

    button.innerHTML =
      originalButtonContent;
  }
}


/*
 * Detecta el botón para probar
 * el scope inválido.
 */
document.addEventListener(
  "click",
  async (event) => {
    const button = event.target.closest(
      "[data-test-invalid-scope]"
    );

    if (!button) {
      return;
    }

    await testInvalidScope();
  }
);


/*
 * Vista principal.
 */
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
          supportsServiceWorker
            ? "Sí"
            : "No",
          supportsServiceWorker
            ? "success"
            : "error"
        )}

        ${createDiagnosticRow(
          "¿Contexto seguro?",
          secureContext
            ? "Sí"
            : "No",
          secureContext
            ? "success"
            : "error"
        )}

        ${createDiagnosticRow(
          "¿Service Worker registrado?",
          registration
            ? "Sí"
            : "No",
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
          worker?.scriptURL ||
            "No disponible",
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
          controlsPage
            ? "Sí"
            : "No",
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


    <section class="card invalid-scope-card">
      <p class="hero__eyebrow">
        Experimento
      </p>

      <h3>
        Scope inválido a propósito
      </h3>

      <p>
        Este experimento intenta registrar el archivo
        <code>/src/sw.js</code> utilizando el scope
        <code>/</code>.
      </p>

      <p>
        El navegador debería rechazar el registro porque
        el scope solicitado se encuentra por encima de la
        carpeta donde está ubicado el Service Worker.
      </p>

      <button
        type="button"
        class="invalid-scope-button"
        data-test-invalid-scope
      >
        <span
          class="invalid-scope-button__icon"
          aria-hidden="true"
        >
          ⚠
        </span>

        <span>
          Probar scope inválido
        </span>
      </button>

      <p
        id="invalid-scope-result"
        class="invalid-scope-result"
        aria-live="polite"
      ></p>
    </section>
  `;
}