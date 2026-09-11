function showStorageWarning() {
    if (!document.body) {
        return;
    }

    const warning = document.createElement("div");
    warning.className = "storage-warning";
    warning.setAttribute("role", "status");
    warning.setAttribute("aria-live", "polite");
    warning.textContent =
        "La persistencia no está disponible. La aplicación seguirá funcionando durante esta sesión.";

    const visibleWarnings = document.querySelectorAll(".storage-warning");
    warning.style.bottom = `${1 + visibleWarnings.length * 4.75}rem`;

    document.body.append(warning);
    window.setTimeout(() => warning.remove(), 6000);
}

function getStorage(storageName) {
    try {
        return window[storageName];
    } catch (error) {
        showStorageWarning();
        return null;
    }
}

/** Lee un valor o devuelve null si Storage no está disponible. */
export function readStorageItem(storageName, key) {
    const storage = getStorage(storageName);

    if (!storage) {
        return null;
    }

    try {
        return storage.getItem(key);
    } catch (error) {
        showStorageWarning();
        return null;
    }
}

/** Guarda un valor y devuelve false si no fue posible persistirlo. */
export function writeStorageItem(storageName, key, value) {
    const storage = getStorage(storageName);

    if (!storage) {
        return false;
    }

    try {
        storage.setItem(key, value);
        return true;
    } catch (error) {
        showStorageWarning();
        return false;
    }
}

/** Elimina un valor y devuelve false si no fue posible hacerlo. */
export function removeStorageItem(storageName, key) {
    const storage = getStorage(storageName);

    if (!storage) {
        return false;
    }

    try {
        storage.removeItem(key);
        return true;
    } catch (error) {
        showStorageWarning();
        return false;
    }
}
