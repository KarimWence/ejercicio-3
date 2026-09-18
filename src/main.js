import Router from "./router/router.js";
import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import PublicationDetailView from "./views/ItemDetailView.js";
import NewsView from "./views/NewsView.js";
import DiagnosticsView from "./views/DiagnosticsView.js";
import ProjectsView, {
    setCategoryFilter,
} from "./views/ProjectsView.js";

import {
    saveFavoriteProject,
    deleteFavoriteProject,
} from "./services/dbService.js";
import { deleteCookie } from "./services/cookieService.js";
import { initializeTheme } from "./utils/theme.js";
import { registerVisit } from "./services/cookieService.js";
import {
    removeStorageItem,
    writeStorageItem,
} from "./utils/storage.js";

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
        path: "/registros",
        view: ProjectsView,
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

const visitCount = registerVisit();
console.log(`Visita número ${visitCount} durante los últimos 30 días.`);

document.addEventListener("submit", async (event) => {
    // Formulario para agregar proyectos
    if (event.target.id === "project-form") {
        event.preventDefault();

        const formData = new FormData(event.target);

        const title = String(
            formData.get("title") || ""
        ).trim();

        const category = String(
            formData.get("category") || ""
        ).trim();

        const description = String(
            formData.get("description") || ""
        ).trim();

        if (!title || !category || !description) {
            return;
        }

        const project = {
            id: crypto.randomUUID(),
            title,
            category,
            description,
        };

        await saveFavoriteProject(project);

        setCategoryFilter("");

        router.render({
    showSkeleton: false,
    scrollToTop: false,
});

        return;
    }

    // Formulario de búsqueda de noticias
    if (event.target.id === "news-search-form") {
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

        router.render();
    }
});

document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(
        "[data-delete-project]"
    );

    if (deleteButton) {
        const projectId = deleteButton.dataset.deleteProject;

deleteFavoriteProject(projectId).then(() => {
    router.render({
        showSkeleton: false,
        scrollToTop: false,
    });
});

        return;
    }

    const button = event.target.closest("[data-clear-storage]");

    if (!button) {
        return;
    }

    const storageType = button.dataset.clearStorage;

    if (storageType === "local") {
        removeStorageItem("localStorage", "app-theme");
        document.documentElement.dataset.theme = "light";
    } else if (storageType === "session") {
        removeStorageItem("sessionStorage", "newsSearch");
    } else if (storageType === "cookie") {
        deleteCookie("appVisits");
    }

    router.render();
});

window.addEventListener("storage-updated", () => {
    router.render();
});

document.addEventListener("change", (event) => {
    if (event.target.id !== "category-filter") {
        return;
    }

setCategoryFilter(event.target.value);

router.render({
    showSkeleton: false,
    scrollToTop: false,
});
});

// Inicia el router
router.init();
