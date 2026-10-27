import Router from "./router/router.js";
import { shareProject } from "./services/shareService.js";
import { registerServiceWorker } from "./pwa/registerSW.js";
import { initializeInstall } from "./pwa/install.js";

import {
    deleteFavoriteProject,
    enqueueOutboxItem,
    saveFavoriteProject,
} from "./services/dbService.js";
import {
    registerOutboxSync,
    retryOutboxNow,
    supportsBackgroundSync,
} from "./services/backgroundSync.js";
import {
    getCurrentLocation,
    getLocationPermissionState,
} from "./services/geolocationService.js";
import { withBasePath } from "./config.js";

import {
    deleteCookie,
    registerVisit,
} from "./services/cookieService.js";

import {
    removeStorageItem,
    writeStorageItem,
} from "./utils/storage.js";

import {
    initializeTheme,
} from "./utils/theme.js";

import { initializeConnectivity } from "./utils/connectivity.js";

import { showFeedback } from "./utils/feedback.js";
import "./utils/cacheDebug.js";

import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import ServiceWorkerView from "./views/ServiceWorkerView.js";
import PublicationDetailView from "./views/ItemDetailView.js";
import NewsView from "./views/NewsView.js";
import DiagnosticsView from "./views/DiagnosticsView.js";
import CollaborationView from "./views/CollaborationView.js";

import FavoritesView, {
    setFavoritesCategory,
} from "./views/FavoritesView.js";

/*
 * Inicializa el botón y los eventos de instalación
 */
initializeInstall();


const routes = [
    {
        path: "/",
        view: HomeView,
    },
    {
        path: "/noticias",
        view: NewsView,
    },
    {
        path: "/favoritos",
        view: FavoritesView,
    },
    {
        path: "/colaborar",
        view: CollaborationView,
    },
    {
        path: "/acerca",
        view: AboutView,
    },
    {
        path: "/diagnostico",
        view: DiagnosticsView,
    },
    {
        path: "/service-worker",
        view: ServiceWorkerView,
    },
    {
        path: "/item/:id",
        view: PublicationDetailView,
    },
];


const app = document.getElementById("app");

const router = new Router(routes, app);

async function refreshAfterOutboxChange() {
    if (router.getCurrentPath() !== "/colaborar") {
        return;
    }

    await router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
}

async function retryOutboxFallback(showResult = false) {
    if (!navigator.onLine) {
        if (showResult) {
            showFeedback("No hay conexión. Las propuestas siguen pendientes.", "info");
        }
        return 0;
    }

    try {
        const sentCount = await retryOutboxNow();
        await refreshAfterOutboxChange();

        if (showResult) {
            showFeedback(
                sentCount
                    ? `${sentCount} propuesta${sentCount === 1 ? "" : "s"} enviada${sentCount === 1 ? "" : "s"}.`
                    : "No hay propuestas pendientes por enviar.",
                "success"
            );
        }

        return sentCount;
    } catch (error) {
        console.warn("[Outbox] No se pudo completar el reintento:", error);

        if (showResult) {
            showFeedback(
                "El envío falló. La propuesta permanece en la cola para reintentarse.",
                "error"
            );
        }

        return 0;
    }
}


/*
 * Registro del Service Worker
 */
window.addEventListener("load", async () => {
    const registration = await registerServiceWorker();

    if (registration) {
        console.log(
            "[PWA] Service Worker listo:",
            registration.scope
        );
    }

    if (!supportsBackgroundSync()) {
        retryOutboxFallback();
    }
});

window.addEventListener("online", () => {
    if (!supportsBackgroundSync()) {
        retryOutboxFallback();
    }
});

navigator.serviceWorker?.addEventListener("message", async (event) => {
    if (event.data?.type !== "OUTBOX_SYNC_COMPLETED") {
        return;
    }

    await refreshAfterOutboxChange();
    showFeedback("Las propuestas pendientes se enviaron correctamente.", "success");
});


/*
 * Recupera y aplica el tema guardado
 */
initializeTheme();

/*
 * Inicializa la detección de conectividad (indicador offline/online)
 */
initializeConnectivity();


/*
 * Registra la visita del usuario
 */
const visitCount = registerVisit();

console.log(
    `Visita número ${visitCount} durante los últimos 30 días.`
);


/*
 * Formularios
 */
document.addEventListener("submit", async (event) => {
    if (event.target.id === "collaboration-form") {
        event.preventDefault();

        const formData = new FormData(event.target);
        const projectSelect = event.target.elements.projectId;
        const id = globalThis.crypto?.randomUUID?.()
            ?? `proposal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const createdAt = new Date().toISOString();

        try {
            await enqueueOutboxItem({
                id,
                type: "collaboration-request",
                endpoint: withBasePath("api/collaboration-requests"),
                method: "POST",
                status: "pending",
                createdAt,
                payload: {
                    id,
                    projectId: String(formData.get("projectId")),
                    projectTitle: projectSelect.selectedOptions[0].textContent.trim(),
                    contactName: String(formData.get("contactName")).trim(),
                    proposal: String(formData.get("proposal")).trim(),
                    meetingArea: String(formData.get("meetingArea") || "").trim(),
                    deviceLocation: String(formData.get("deviceLocation") || ""),
                    createdAt,
                },
            });

            let usesBackgroundSync = false;
            let fallbackSentCount = 0;

            try {
                usesBackgroundSync = await registerOutboxSync();
            } catch (error) {
                console.warn("[Outbox] No se pudo registrar Background Sync:", error);
            }

            if (!usesBackgroundSync) {
                fallbackSentCount = await retryOutboxFallback();
            }

            await router.render({
                showSkeleton: false,
                scrollToTop: false,
            });

            showFeedback(
                usesBackgroundSync
                    ? "Propuesta guardada; se enviará cuando haya conexión."
                    : fallbackSentCount
                        ? "Propuesta guardada y enviada correctamente."
                        : "Propuesta guardada; se reintentará al abrir, recuperar conexión o pulsar el botón.",
                "success"
            );
        } catch (error) {
            console.error("No se pudo guardar la propuesta en la cola:", error);
            showFeedback(
                "No se pudo guardar la propuesta. Comprueba el almacenamiento del navegador e inténtalo de nuevo.",
                "error"
            );
        }

        return;
    }

    /*
     * Formulario de búsqueda de noticias
     */
    if (event.target.id !== "news-search-form") {
        return;
    }

    event.preventDefault();

    const formData = new FormData(event.target);

    const search = String(
        formData.get("search") || ""
    ).trim();

    if (search) {
        writeStorageItem(
            "sessionStorage",
            "newsSearch",
            search
        );
    } else {
        removeStorageItem(
            "sessionStorage",
            "newsSearch"
        );
    }

    await router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
});


/*
 * Filtro de categorías de favoritos
 */
document.addEventListener("change", async (event) => {
    const categoryFilter = event.target.closest(
        "#favorites-category-filter"
    );

    if (!categoryFilter) {
        return;
    }

    setFavoritesCategory(categoryFilter.value);

    await router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
});


/*
 * Botones y acciones
 */
document.addEventListener("click", async (event) => {
    const requestLocationButton = event.target.closest("[data-request-location]");

        const shareButton = event.target.closest("[data-share-project]");

    if (shareButton) {
        event.preventDefault();

        const article = shareButton.closest(".detail-card");
        const title = article
            ?.querySelector(".detail-header h2")
            ?.textContent.trim() || "Proyecto ODS";

        shareButton.disabled = true;

        try {
            const result = await shareProject({
                title,
                text: `Conoce este proyecto: ${title}`,
                url: window.location.href,
            });

            if (result === "shared") {
                showFeedback(
                    "Solicitud de compartir completada.",
                    "success",
                    2500
                );
            } else if (result === "copied") {
                showFeedback(
                    "Enlace copiado. Ya puedes pegarlo para compartir.",
                    "success",
                    3000
                );
            } else if (result === "cancelled") {
                showFeedback("Compartir cancelado.", "info", 2000);
            }
        } catch (error) {
            showFeedback(error.message, "error");
        } finally {
            shareButton.disabled = false;
        }

        return;
    }

    if (requestLocationButton) {
        const result = document.getElementById("location-request-result");
        const permissionStatus = document.getElementById("location-permission-status");

        requestLocationButton.disabled = true;

        if (result) {
            result.textContent = "Obteniendo ubicación aproximada…";
        }

        try {
            const location = await getCurrentLocation();
            const locationInput = document.getElementById("collaboration-device-location");

            if (locationInput) {
                locationInput.value = JSON.stringify(location);
            }

            if (result) {
                result.textContent = `Ubicación aproximada obtenida y lista para adjuntarse a la propuesta (precisión de ${Math.round(location.accuracy)} metros).`;
            }

            showFeedback("Ubicación aproximada obtenida.", "success");
        } catch (error) {
            if (result) {
                result.textContent = error.message;
            }

            showFeedback(error.message, "error");
        } finally {
            const permission = await getLocationPermissionState();

            if (permissionStatus) {
                permissionStatus.textContent = {
                    granted: "Permitido",
                    denied: "Bloqueado",
                    prompt: "Aún no solicitado",
                    unavailable: "No disponible en este navegador",
                }[permission] ?? "No disponible";
            }

            requestLocationButton.disabled = false;
        }

        return;
    }

    const retryOutboxButton = event.target.closest("[data-retry-outbox]");

    if (retryOutboxButton) {
        retryOutboxButton.disabled = true;
        await retryOutboxFallback(true);
        retryOutboxButton.disabled = false;
        return;
    }

    /*
     * Actualizar el diagnóstico del Service Worker
     */
    const refreshWorkerButton = event.target.closest(
        "[data-refresh-worker]"
    );

    if (refreshWorkerButton) {
        await router.render({
            showSkeleton: false,
            scrollToTop: false,
        });

        return;
    }


    /*
     * Agregar un proyecto a favoritos
     */
    const favoriteButton = event.target.closest(
        "[data-add-favorite]"
    );

    if (favoriteButton) {
        const projectId =
            favoriteButton.dataset.addFavorite;

        const { default: PublicationsService } =
            await import(
                "./services/itemsService.js"
            );

        const service =
            new PublicationsService();

        const project =
            await service.getById(projectId);

        if (!project) {
            console.error(
                `No se encontró el proyecto con ID: ${projectId}`
            );

            showFeedback(
                "No se encontró el proyecto solicitado.",
                "error"
            );

            return;
        }

        try {
            await saveFavoriteProject(project);

            favoriteButton.textContent =
                "★ Agregado a favoritos";

            favoriteButton.disabled = true;

            favoriteButton.setAttribute(
                "aria-pressed",
                "true"
            );

            showFeedback(
                "Proyecto agregado a favoritos.",
                "success"
            );
        } catch (error) {
            console.error(
                "No se pudo guardar el proyecto favorito:",
                error
            );

            showFeedback(
                "No se pudo guardar en favoritos. Comprueba el almacenamiento de tu navegador e inténtalo de nuevo.",
                "error"
            );
        }

        return;
    }


    /*
     * Eliminar un proyecto de favoritos
     */
    const deleteFavoriteButton = event.target.closest(
        "[data-delete-favorite]"
    );

    if (deleteFavoriteButton) {
        event.preventDefault();
        event.stopPropagation();

        const projectId =
            deleteFavoriteButton.dataset.deleteFavorite;

        try {
            await deleteFavoriteProject(projectId);

            await router.render({
                showSkeleton: false,
                scrollToTop: false,
            });

            showFeedback(
                "Proyecto eliminado de favoritos.",
                "success"
            );
        } catch (error) {
            console.error(
                "No se pudo eliminar el proyecto favorito:",
                error
            );

            showFeedback(
                "No se pudo eliminar de favoritos. Inténtalo nuevamente.",
                "error"
            );
        }

        return;
    }


    /*
     * Limpiar almacenamiento
     */
    const clearButton = event.target.closest(
        "[data-clear-storage]"
    );

    if (!clearButton) {
        return;
    }

    const storageType =
        clearButton.dataset.clearStorage;

    if (storageType === "local") {
        removeStorageItem(
            "localStorage",
            "app-theme"
        );

        document.documentElement.dataset.theme =
            "light";
    } else if (storageType === "session") {
        removeStorageItem(
            "sessionStorage",
            "newsSearch"
        );
    } else if (storageType === "cookie") {
        deleteCookie("appVisits");
    }

    await router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
});


/*
 * Actualiza la vista cuando cambia el almacenamiento
 */
window.addEventListener("storage-updated", () => {
    router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
});

/*
 * Actualiza la vista cuando cambia la caché (Cache API)
 */
window.addEventListener("cache-updated", () => {
    router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
});


/*
 * Inicia el router
 */
router.init();
