console.log("[SW] Script en ejecución");

console.log("[SW] Contexto global: ", self.constructor.name);

//No tiene acceso
console.log("[SW] typeof window => ", typeof window);
console.log("[SW] typeof document => ", typeof document);
console.log("[SW] typeof localStorage => ", typeof localStorage);

//Sí tiene acceso
console.log("[SW] typeof indexedDB => ", typeof indexedDB);
console.log("[SW] typeof caches => ", typeof caches);

//Scope del service worker
console.log("[SW] Scope => ", self.registration.scope);