import { BASE_PATH, withBasePath,} from "../config.js";
import { SW_URL, SW_SCOPE } from "../pwa/registerSW.js";
import { showFeedback } from "../utils/feedback.js";
import {
  listCacheEntries,
  deleteCacheEntry,
  seedOutdatedExperimentData,
  fetchExperimentResource,
  fetchNetworkFirstResource,
  fetchSwrResource,
  getActiveCache,
  EXPERIMENT_REL_URL,
  NETWORK_FIRST_REL_URL,
  SWR_REL_URL,
} from "../utils/cacheDebug.js";

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
  
  const appRoot =
    withBasePath("");

  const appRootWithoutSlash =
    appRoot.length > 1
      ? appRoot.replace(/\/$/, "")
      : appRoot;

 
  const parentScope =
    BASE_PATH === "/"
      ? "/"
      : BASE_PATH.slice(
          0,
          BASE_PATH
            .slice(0, -1)
            .lastIndexOf("/") + 1
        );

  const routes = [
    {
      type: "Raíz de la app",
      url: appRoot,
      display: appRoot,
    },
    {
      type: "Ruta del router",
      url: withBasePath("service-worker"),
      display: withBasePath("service-worker"),
    },
    {
      type: "Archivo interno",
      url: withBasePath("src/main.js"),
      display: withBasePath("src/main.js"),
    },
    {
      type: "Raíz sin diagonal final",
      url: appRootWithoutSlash,
      display: appRootWithoutSlash,
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

  const invalidWorkerUrl = withBasePath("src/sw.js");

  const requestedScope = SW_SCOPE;


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
    `Intentando registrar ${invalidWorkerUrl} ` +
    `con el scope ${requestedScope}...`;

  output.className =
    "invalid-scope-result invalid-scope-result--loading";

  try {
    const registration =
      await navigator.serviceWorker.register(
        invalidWorkerUrl,
        {
          scope: requestedScope,
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
 * Tabla con el contenido de la caché.
 */
function createCacheTable(entries, activeCacheName) {
  if (!entries || entries.length === 0) {
    return `
      <div class="card scope-empty">
        No hay recursos guardados en la caché actual.
      </div>
    `;
  }

  return `
    <div style="margin-bottom: 0.75rem;">
      <button type="button" class="diagnostic-button" data-refresh-cache>
        Actualizar lista
      </button>
    </div>

    <div class="scope-table-container">
      <table class="scope-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Recurso</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${entries
            .map(
              (entry) => `
            <tr>
              <td>
                <span class="cache-badge ${
                  entry.type.includes("Precache")
                    ? "cache-badge--precache"
                    : "cache-badge--runtime"
                }">
                  ${entry.type}
                </span>
              </td>
              <td>
                <code>${entry.pathname}</code>
              </td>
              <td>
                <button
                  type="button"
                  class="btn-delete-cache"
                  data-delete-cache-entry="${entry.url}"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

/*
 * Sección de pruebas de estrategias de caché (Network First y SWR).
 */
function createExperimentSection() {
  return `
    <section class="card">
      <p class="hero__eyebrow">
        Estrategia 1 · Network First
      </p>

      <h3>
        Prueba de Network First (Pruebas 3 y 4)
      </h3>

      <p>
        Aplica a <code>data/dato-experimento.json</code> y a la API externa. Prioriza la red para obtener el dato más reciente; si la red falla o está en modo Offline, devuelve la copia en caché.
      </p>

      <div class="experiment-actions">
        <button type="button" class="diagnostic-button" data-exp-nf-fetch>
          Consultar con Network First
        </button>

        <button type="button" class="btn-delete-cache" data-exp-nf-delete>
          Borrar dato de caché
        </button>
      </div>

      <div id="exp-network-first-output" class="experiment-output">
        <p>Presiona <strong>Consultar con Network First</strong> para probar la respuesta con red u offline.</p>
      </div>
    </section>

    <section class="card" style="margin-top: 1.5rem;">
      <p class="hero__eyebrow">
        Estrategia 2 · Stale-While-Revalidate
      </p>

      <h3>
        Prueba de SWR (Prueba 5)
      </h3>

      <p>
        Aplica a <code>data/dato-experimento-2.json</code>. Devuelve la versión en caché inmediatamente (HIT instantáneo) y lanza una petición a la red en segundo plano para actualizar la caché.
      </p>

      <div class="experiment-actions">
        <button type="button" class="diagnostic-button" data-exp-swr-fetch>
          Consultar con SWR
        </button>

        <button type="button" class="diagnostic-button" data-exp-seed-stale>
          Simular versión vieja en caché
        </button>

        <button type="button" class="btn-delete-cache" data-exp-swr-delete>
          Borrar dato de caché
        </button>
      </div>

      <div id="exp-swr-output" class="experiment-output">
        <p>Presiona <strong>Consultar con SWR</strong> para verificar la entrega inmediata y revalidación asíncrona.</p>
      </div>
    </section>
  `;
}

/*
 * Consulta el recurso de Network First.
 */
async function runNetworkFirstFetch() {
  const container = document.getElementById("exp-network-first-output");
  if (!container) return;

  container.innerHTML = `<p>Consultando recurso...</p>`;

  try {
    const result = await fetchNetworkFirstResource();
    container.innerHTML = `
      <p><strong>Origen:</strong> ${result.source}</p>
      <p><strong>Versión:</strong> ${result.data?.version ?? "N/A"}</p>
      <p><strong>Título:</strong> ${result.data?.titulo || ""}</p>
      <p><strong>Mensaje:</strong> ${result.data?.mensaje || ""}</p>
      <p><strong>Actualizado:</strong> ${result.data?.actualizado || ""}</p>
    `;
  } catch (error) {
    container.innerHTML = `<p style="color: #991b1b;">Error al consultar: ${error.message}</p>`;
  }
}

/*
 * Consulta el recurso de SWR.
 */
async function runSwrFetch() {
  const container = document.getElementById("exp-swr-output");
  if (!container) return;

  container.innerHTML = `<p>Consultando recurso...</p>`;

  try {
    const result = await fetchSwrResource();
    container.innerHTML = `
      <p><strong>Origen:</strong> ${result.source}</p>
      <p><strong>Versión:</strong> ${result.data?.version ?? "N/A"}</p>
      <p><strong>Título:</strong> ${result.data?.titulo || ""}</p>
      <p><strong>Mensaje:</strong> ${result.data?.mensaje || ""}</p>
      <p><strong>Actualizado:</strong> ${result.data?.actualizado || ""}</p>
      <small style="display: block; margin-top: 0.5rem; color: var(--ink-soft);">
        La 1.ª consulta entrega la copia en caché y revalida en red; la 2.ª consulta muestra el dato nuevo.
      </small>
    `;
  } catch (error) {
    container.innerHTML = `<p style="color: #991b1b;">Error al consultar: ${error.message}</p>`;
  }
}

/*
 * Detecta clics en los botones de la vista.
 */
document.addEventListener(
  "click",
  async (event) => {
    // Probar scope inválido
    const scopeBtn = event.target.closest("[data-test-invalid-scope]");
    if (scopeBtn) {
      await testInvalidScope();
      return;
    }

    // Eliminar entrada individual de la caché con cache.delete()
    const deleteBtn = event.target.closest("[data-delete-cache-entry]");
    if (deleteBtn) {
      const url = deleteBtn.dataset.deleteCacheEntry;
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Borrando...";
      const success = await deleteCacheEntry(url);
      if (success) {
        showFeedback("Entrada eliminada de la caché.", "success");
      }
      return;
    }

    // Refrescar lista de caché
    const refreshCacheBtn = event.target.closest("[data-refresh-cache]");
    if (refreshCacheBtn) {
      window.dispatchEvent(new CustomEvent("cache-updated"));
      showFeedback("Lista de caché actualizada.", "info");
      return;
    }

    // Network First: Consultar
    const nfFetchBtn = event.target.closest("[data-exp-nf-fetch]");
    if (nfFetchBtn) {
      nfFetchBtn.disabled = true;
      await runNetworkFirstFetch();
      nfFetchBtn.disabled = false;
      return;
    }

    // Network First: Borrar de caché
    const nfDeleteBtn = event.target.closest("[data-exp-nf-delete]");
    if (nfDeleteBtn) {
      nfDeleteBtn.disabled = true;
      const targetUrl = new URL(withBasePath(NETWORK_FIRST_REL_URL), window.location.origin).href;
      await deleteCacheEntry(targetUrl);
      showFeedback("Entrada de Network First eliminada de caché.", "success");
      const container = document.getElementById("exp-network-first-output");
      if (container) {
        container.innerHTML = `<p>Entrada eliminada de la caché. Al consultar en modo con red se descargará nuevamente.</p>`;
      }
      nfDeleteBtn.disabled = false;
      return;
    }

    // SWR: Consultar
    const swrFetchBtn = event.target.closest("[data-exp-swr-fetch]");
    if (swrFetchBtn) {
      swrFetchBtn.disabled = true;
      await runSwrFetch();
      swrFetchBtn.disabled = false;
      return;
    }

    // SWR: Simular versión previa (v1)
    const seedBtn = event.target.closest("[data-exp-seed-stale]");
    if (seedBtn) {
      seedBtn.disabled = true;
      await seedOutdatedExperimentData();
      showFeedback("Versión previa inyectada en caché (v1).", "info");
      await runSwrFetch();
      seedBtn.disabled = false;
      return;
    }

    // SWR: Borrar de caché
    const swrDeleteBtn = event.target.closest("[data-exp-swr-delete]");
    if (swrDeleteBtn) {
      swrDeleteBtn.disabled = true;
      const targetUrl = new URL(withBasePath(SWR_REL_URL), window.location.origin).href;
      await deleteCacheEntry(targetUrl);
      showFeedback("Entrada de SWR eliminada de caché.", "success");
      const container = document.getElementById("exp-swr-output");
      if (container) {
        container.innerHTML = `<p>Entrada eliminada. Presiona "Consultar con SWR" para obtener la versión fresca.</p>`;
      }
      swrDeleteBtn.disabled = false;
      return;
    }
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
      await navigator.serviceWorker.getRegistration(SW_SCOPE);
  }

  const worker =
    getCurrentWorker(registration);

  const controlsPage =
    supportsServiceWorker &&
    navigator.serviceWorker.controller !== null;

  const scope =
    registration?.scope || null;

  // Requisito 5: Obtener la caché activa y listar sus entradas actuales
  const activeCache = await getActiveCache();
  const cacheEntries = await listCacheEntries();

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
            new URL(
              SW_URL,
              window.location.origin
            ).href,

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
        <code> ${withBasePath("src/sw.js")}</code>

        utilizando el scope
    
        <code>${SW_SCOPE}</code>.
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

    <section class="card">
      <p class="hero__eyebrow">
        Caché
      </p>

      <h3>
        Contenido de la caché
      </h3>

      <p>
        Lista de recursos almacenados en la versión activa (<code>${activeCache?.name || "sin caché"}</code>).
      </p>

      ${createCacheTable(cacheEntries, activeCache?.name)}
    </section>

    ${createExperimentSection()}
  `;
}