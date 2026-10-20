import { deleteOutboxItem, getOutboxItems, } from "./dbService.js";

export const OUTBOX_SYNC_TAG = "sync-collaboration-outbox";

export function supportsBackgroundSync() {
  return (
    "SyncManager" in window &&
    typeof window.SyncManager !== "undefined" &&
    "serviceWorker" in navigator
  );
}

export async function registerOutboxSync() {
  if (!supportsBackgroundSync()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  if (!registration.sync) {
    return false;
  }

  await registration.sync.register(OUTBOX_SYNC_TAG);
  return true;
}

async function sendOutboxItem(item) {
  const response = await fetch(item.endpoint, {
    method: item.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item.payload),
  });

  if (!response.ok) {
    throw new Error(`El servidor respondió con ${response.status}.`);
  }
}

/**
 * Plan B para navegadores sin Background Sync. Solo elimina elementos
 * después de que el servidor confirma una respuesta correcta.
 */
export async function retryOutboxNow() {
  const pendingItems = (await getOutboxItems())
    .filter((item) => item.type === "collaboration-request")
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));

  let sentCount = 0;

  for (const item of pendingItems) {
    await sendOutboxItem(item);
    await deleteOutboxItem(item.id);
    sentCount += 1;
  }

  return sentCount;
}
