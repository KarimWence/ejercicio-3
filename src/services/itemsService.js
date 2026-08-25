// Servicio "mock": simula una fuente de datos (podría ser un fetch real
// a una API). Exportación por defecto a propósito: la importarás de
// forma DINÁMICA en ItemDetailView.js.
//
// ── TODO ─────────────────────────────────────────────
// Reemplaza el arreglo ITEMS por los datos de tu propio tema (mínimo 4
// elementos, mínimo 3 campos cada uno). Puedes renombrar "ItemsService"
// y "Item" si quieres (ej. RecetasService / Receta), pero no es
// obligatorio: lo que se califica son los datos y los campos, no el
// nombre de la clase.
//
// Ejemplo si tu tema fuera "recetas":
//   { id: "1", title: "Tacos al pastor", description: "...", meta: "30 min" }

const PUBLICATIONS = [
  {
    id: "1",
    title: "Huertos urbanos comunitarios",
    description:
      "Proyecto enfocado en desarrollar huertos urbanos comunitarios para promover el acceso a alimentos saludables y fomentar la participación de la comunidad.",
    problem:
      "En algunas comunidades existe un acceso limitado a alimentos frescos y saludables, además de pocos espacios destinados a la producción local.",
    objective:
      "Crear huertos urbanos administrados de manera colaborativa por miembros de la comunidad.",
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
    problem:
      "Algunos estudiantes tienen dificultades para encontrar recursos educativos confiables y espacios para colaborar fuera del aula.",
    objective:
      "Desarrollar una plataforma que permita compartir recursos y facilitar la colaboración académica.",
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
    problem:
      "La separación inadecuada de residuos dificulta el reciclaje y genera una mayor cantidad de desechos dentro de la institución.",
    objective:
      "Implementar una solución que facilite la identificación, separación y seguimiento de los residuos reciclables.",
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
    problem:
      "Existe poca conexión entre las personas que tienen conocimientos académicos y las organizaciones que enfrentan problemáticas sociales.",
    objective:
      "Crear un espacio digital que facilite la formación de equipos y la colaboración entre distintos actores.",
    ods: ["ODS 17 - Alianzas para lograr los objetivos"],
    status: "En evaluación",
    creator: "Luis Hernández",
    members: 5,
    progress: 90,
  },
];

export default class PublicationsService {
  async getAll() {
    return PUBLICATIONS;
  }

  async getById(id) {
    return PUBLICATIONS.find((publication) => publication.id === id) ?? null;
  }
}
