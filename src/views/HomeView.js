import PublicationCard from "../components/ItemCard.js";

// Lista de proyectos para la vista principal.
// Dejamos este arreglo aquí para evitar importar itemsService.js de forma estática en el inicio,
// permitiendo demostrar que itemsService.js se descarga ÚNICAMENTE por import dinámico al entrar al detalle.
const PUBLICATIONS = [
  {
    id: "1",
    title: "Huertos urbanos comunitarios",
    description:
      "Proyecto enfocado en desarrollar huertos urbanos comunitarios para promover el acceso a alimentos saludables y fomentar la participación de la comunidad.",
    ods: ["ODS 2 - Hambre cero", "ODS 11 - Ciudades y comunidades sostenibles"],
    status: "En desarrollo",
    creator: "María González",
    members: 6,
    progress: 65,
  },
  {
    id: "2",
    title: "Plataforma de apoyo educativo",
    description:
      "Iniciativa para desarrollar una plataforma digital que facilite el acceso a recursos educativos y apoye el aprendizaje colaborativo entre estudiantes.",
    ods: ["ODS 4 - Educación de calidad"],
    status: "Publicado",
    creator: "Carlos Ramírez",
    members: 4,
    progress: 30,
  },
  {
    id: "3",
    title: "Sistema de reciclaje universitario",
    description:
      "Proyecto orientado a mejorar la separación y recolección de residuos dentro de la comunidad universitaria mediante una solución tecnológica.",
    ods: ["ODS 12 - Producción y consumo responsables"],
    status: "En desarrollo",
    creator: "Ana Martínez",
    members: 8,
    progress: 70,
  },
  {
    id: "4",
    title: "Red de colaboración comunitaria",
    description:
      "Iniciativa que busca conectar estudiantes, docentes y organizaciones para colaborar en proyectos destinados a resolver problemáticas sociales.",
    ods: ["ODS 17 - Alianzas para lograr los objetivos"],
    status: "En evaluación",
    creator: "Luis Hernández",
    members: 5,
    progress: 90,
  },
];

export default async function HomeView() {
  return `
    <h2>Proyectos de Impacto Social</h2>
    <div class="grid">
      ${PUBLICATIONS.map((publication) => PublicationCard(publication)).join("")}
    </div>
  `;
}

