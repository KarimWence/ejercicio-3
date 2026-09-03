// services/apiService.js
// Servicio para consultar la API REST publica de noticias de ciencia

export default class ApiService {
  constructor() {
    this.baseUrl = "https://api.spaceflightnewsapi.net/v4/articles";
    this.timeout = 5000;
    this.maxRetries= 3;
  }

  // Obtiene un listado de articulos de ciencia y tecnologia
  async getNews(limit = 9) {
    const url = `${this.baseUrl}/?limit=${limit}`;

    let attempts = 0;

    while(attempts <= this.maxRetries){
      try{
        attempts++;

        const controller = new AbortController();

        const timeoutId = setTimeout(()=> {
          controller.abort();
        }, this.timeout);

        try {
          const response = await fetch(url, {
            signal: controller.signal,
          });
    
          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = new Error(
              `Error en la petición HTTP: ${response.status} ${response.statusText}`
            );

            error.type = "http";
            error.status = response.status;

            throw error;
          }

          const data = await response.json();

          return data.results || [];

        } catch (error) {
          clearTimeout(timeoutId);

          // 1. TIMEOUT
          if (error.name === "AbortError") {
            console.error("La petición excedió el tiempo límite.");
            throw error;
          }
          // 2. ERROR DE RED / CORS
          if (error instanceof TypeError) {
            if (attempts <= this.maxRetries) {
              console.log(
                `Error de red/CORS. Reintentando petición... (${attempts}/${this.maxRetries})`
              );

              continue;
            }
            console.error(
              "La petición falló después del reintento por un error de red/CORS."
            );
            throw error;
          }
          // 3. ERROR HTTP DEL SERVIDOR
          if (error.type === "http") {
            console.error(
              `Error HTTP del servidor: ${error.status}`
            );
            // NO se reintenta
            throw error;
          }
          // Cualquier otro error
          throw error;
        }

      } catch (error) {
        console.error("Fallo al consultar la API de noticias:", error);
        throw error;
      }
    }
  }
}
