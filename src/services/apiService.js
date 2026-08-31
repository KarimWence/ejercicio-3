// services/apiService.js
// Servicio para consultar la API REST publica de noticias de ciencia

export default class ApiService {
  constructor() {
    this.baseUrl = "https://api.spaceflightnewsapi.net/v4/articles";
  }

  // Obtiene un listado de articulos de ciencia y tecnologia
  async getNews(limit = 9) {
    const url = `${this.baseUrl}/?limit=${limit}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error en la peticion HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Fallo al consultar la API de noticias:", error);
      throw error;
    }
  }
}
