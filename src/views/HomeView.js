import PublicationsService from "../services/itemsService.js";
import PublicationCard from "../components/ItemCard.js";

// TODO: si renombraste "item" a algo de tu tema, ajusta también
// el título de esta vista.
export default async function HomeView() {
  const service = new PublicationsService();
  const publications = await service.getAll();

  return `
    <h2>Elementos disponibles</h2>
    <div class="grid">
      ${publications.map((publication) => PublicationCard(publication)).join("")}
    </div>
  `;
}
