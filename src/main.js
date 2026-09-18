import Router from "./router/router.js";
import { deleteFavoriteProject } from "./services/dbService.js";
import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import PublicationDetailView from "./views/ItemDetailView.js";
import NewsView from "./views/NewsView.js";
import DiagnosticsView from "./views/DiagnosticsView.js";
import FavoritesView, {
    setFavoritesCategory,
} from "./views/FavoritesView.js";

import {
    saveFavoriteProject,
} from "./services/dbService.js";

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
        path: "/acerca",
        view: AboutView,
    },
    {
        path: "/diagnostico",
        view: DiagnosticsView,
    },
    {
        path: "/item/:id",
        view: PublicationDetailView,
    },
];


const app = document.getElementById("app");
const router = new Router(routes, app);


// Recupera y aplica el tema guardado
initializeTheme();


// Registra la visita del usuario
const visitCount = registerVisit();

console.log(
    `Visita número ${visitCount} durante los últimos 30 días.`
);


// Formularios
document.addEventListener("submit", async (event) => {
    // Formulario de búsqueda de noticias
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


// Botones y acciones
document.addEventListener("click", async (event) => {
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
            await import("./services/itemsService.js");

        const service = new PublicationsService();

        const project = await service.getById(projectId);

        if (!project) {
            console.error(
                `No se encontró el proyecto con ID: ${projectId}`
            );

            return;
        }

        await saveFavoriteProject(project);

        favoriteButton.textContent =
            "★ Agregado a favoritos";

        favoriteButton.disabled = true;
        favoriteButton.setAttribute("aria-pressed", "true");

        return;
    }


        const button = event.target.closest("[data-delete-favorite]");

        if (button) {
                event.preventDefault();
                event.stopPropagation();

                const projectId = button.dataset.deleteFavorite;

                try {
                        await deleteFavoriteProject(projectId);

                        await router.render({
                                showSkeleton: false,
                                scrollToTop: false,
                        });
                } catch (error) {
                        console.error("No se pudo eliminar el proyecto favorito:", error);
                }

                return;
    }

    /*
     * Botones para limpiar almacenamiento
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


// Actualiza la vista cuando cambia el almacenamiento
window.addEventListener("storage-updated", () => {
    router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
});


// Inicia el router
router.init();