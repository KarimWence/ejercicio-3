import PublicationCard from "../components/ItemCard.js";
import PublicationsService from "../services/itemsService.js";

export default async function HomeView() {
  const service = new PublicationsService();
  const publications = await service.getAll();

  return `
    <header class="hero">
      <p class="hero__eyebrow">Catalogo</p>
      <h2 class="hero__title">Proyectos de Impacto Social</h2>
      <p class="hero__subtitle">Iniciativas academicas vinculadas a los Objetivos de Desarrollo Sostenible (ODS).</p>
    </header>

    <div class="grid">
      ${publications.map((publication) => PublicationCard(publication)).join("")}
    </div>
  `;
}