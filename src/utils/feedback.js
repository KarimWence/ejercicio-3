/**
 * Muestra una notificación visual en pantalla (Toast) para dar feedback accesible al usuario.
 * Cumple con accesibilidad mediante role="alert" y soporte de tema claro/oscuro.
 *
 * @param {string} message - El texto a mostrar al usuario.
 * @param {"error" | "success" | "info"} [type="error"] - Tipo de notificación.
 * @param {number} [durationMs=4500] - Tiempo en milisegundos antes de desaparecer automáticamente.
 */
export function showFeedback(message, type = "error", durationMs = 4500) {
    let container = document.getElementById("toast-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        container.setAttribute("aria-live", "assertive");
        container.setAttribute("aria-atomic", "true");
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "alert");

    const icon = type === "error" ? "⚠️" : type === "success" ? "✓" : "ℹ️";

    toast.innerHTML = `
        <span class="toast__icon" aria-hidden="true">${icon}</span>
        <span class="toast__message">${message}</span>
        <button type="button" class="toast__close" aria-label="Cerrar notificación">&times;</button>
    `;

    const closeButton = toast.querySelector(".toast__close");
    let timeoutId;

    const dismiss = () => {
        clearTimeout(timeoutId);
        toast.classList.add("toast--hiding");
        toast.addEventListener("animationend", () => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        });
    };

    if (closeButton) {
        closeButton.addEventListener("click", dismiss);
    }

    timeoutId = setTimeout(dismiss, durationMs);
    container.appendChild(toast);
}
