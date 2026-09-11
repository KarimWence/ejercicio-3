import Router from "./router/router.js";
import HomeView from "./views/HomeView.js";
import AboutView from "./views/AboutView.js";
import PublicationDetailView from "./views/ItemDetailView.js";
import NewsView from "./views/NewsView.js";
import DiagnosticsView from "./views/DiagnosticsView.js";
import { deleteCookie } from "./services/cookieService.js";
import { initializeTheme } from "./utils/theme.js";
import { registerVisit } from "./services/cookieService.js";

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

document.addEventListener("submit", (event) => {
    if (event.target.id !== "news-search-form") return;

    event.preventDefault();

    const formData = new FormData(event.target);
    const search = String(formData.get("search") || "").trim();

    if (search) {
        sessionStorage.setItem("newsSearch", search);
    } else {
        sessionStorage.removeItem("newsSearch");
    }

    // Renderiza nuevamente la vista sin solicitar /noticias al servidor
    router.render();
});

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-clear-storage]");

    if (!button) {
        return;
    }

    const storageType = button.dataset.clearStorage;

    if (storageType === "local") {
        localStorage.removeItem("app-theme");
        document.documentElement.dataset.theme = "light";
    } else if (storageType === "session") {
        sessionStorage.removeItem("newsSearch");
    } else if (storageType === "cookie") {
        deleteCookie("appVisits");
    }

    router.render();
});

window.addEventListener("storage-updated", () => {
    router.render();
});

// Inicia el router
router.init();