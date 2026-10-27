// src/services/shareService.js
// Comparte mediante el menú nativo o copia el enlace como alternativa.

export async function shareProject(data) {
    let canUseNativeShare = false;

    if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function"
    ) {
        try {
            canUseNativeShare = navigator.canShare(data);
        } catch {
            canUseNativeShare = false;
        }
    }

    if (canUseNativeShare) {
        try {
            await navigator.share(data);
            return "shared";
        } catch (error) {
            // Cancelar no se considera un fallo ni provoca una copia.
            if (error.name === "AbortError") {
                return "cancelled";
            }

            // Si falla el menú nativo, intentamos copiar el enlace.
            console.warn("[Share] No se pudo compartir:", error);
        }
    }

    if (typeof navigator.clipboard?.writeText !== "function") {
        throw new Error(
            "No se pudo copiar automáticamente. Copia el enlace desde la barra de direcciones."
        );
    }

    try {
        await navigator.clipboard.writeText(data.url);
        return "copied";
    } catch {
        throw new Error(
            "El navegador no permitió copiar. Copia el enlace desde la barra de direcciones."
        );
    }
}