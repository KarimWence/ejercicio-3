import { readStorageItem, writeStorageItem } from "./storage.js";

const THEME_STORAGE_KEY = "app-theme";
const DEFAULT_THEME = "light";

/**
 * Comprueba que el tema recibido sea válido.
 */
function getValidTheme(theme) {
    return theme === "dark" ? "dark" : "light";
}

/**
 * Aplica el tema y actualiza el botón.
 */
function applyTheme(theme) {
    const validTheme = getValidTheme(theme);
    const themeToggle = document.getElementById("themeToggle");

    document.documentElement.dataset.theme = validTheme;

    if (!themeToggle) {
        return;
    }

    const isDarkTheme = validTheme === "dark";

    themeToggle.setAttribute(
        "aria-label",
        isDarkTheme
            ? "Cambiar a tema claro"
            : "Cambiar a tema oscuro"
    );

    themeToggle.setAttribute(
        "aria-pressed",
        String(isDarkTheme)
    );

    themeToggle.title = isDarkTheme
        ? "Cambiar a tema claro"
        : "Cambiar a tema oscuro";
}

/**
 * Guarda y aplica el tema.
 */
function selectTheme(theme) {
    const validTheme = getValidTheme(theme);

    writeStorageItem("localStorage", THEME_STORAGE_KEY, validTheme);
    applyTheme(validTheme);

    window.dispatchEvent(new CustomEvent("storage-updated"));
}

/**
 * Inicializa el tema de la SPA.
 */
export function initializeTheme() {
    const savedTheme =
        readStorageItem("localStorage", THEME_STORAGE_KEY) || DEFAULT_THEME;

    applyTheme(savedTheme);

    const themeToggle = document.getElementById("themeToggle");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const currentTheme =
                document.documentElement.dataset.theme;

            const newTheme =
                currentTheme === "dark" ? "light" : "dark";

            selectTheme(newTheme);
        });
    }

    // Recibe los cambios realizados desde otra pestaña
    window.addEventListener("storage", (event) => {
        if (
            event.key === THEME_STORAGE_KEY &&
            event.newValue
        ) {
            applyTheme(event.newValue);
        }
    });
}