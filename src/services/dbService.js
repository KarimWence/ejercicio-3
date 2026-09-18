import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8/+esm";

const DB_NAME = 'academicNetworkDB';
const DB_VERSION = 3;
const STORE_NAME = 'favoriteProjects';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id',
      });

      store.createIndex('category', 'category');
    }
  },
});

export async function saveFavoriteProject(project) {
  const db = await dbPromise;

  return db.put(STORE_NAME, {
    ...project,
    savedAt: new Date().toISOString(),
  });
}

export async function getFavoriteProjects() {
  const db = await dbPromise;

  return db.getAll(STORE_NAME);
}

export async function getFavoriteProjectsByCategory(category) {
  const db = await dbPromise;

  return db.getAllFromIndex(STORE_NAME, 'category', category);
}

export async function deleteFavoriteProject(id) {
  const db = await dbPromise;

  return db.delete(STORE_NAME, id);
}