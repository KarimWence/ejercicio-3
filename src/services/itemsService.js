// services/itemsService.js
// Servicio con los datos de publicaciones y proyectos de impacto social

const PUBLICATIONS = [
  {
    id: "1",
    title: "Huertos urbanos comunitarios",
    description:
      "Proyecto enfocado en desarrollar huertos urbanos comunitarios para promover el acceso a alimentos saludables y fomentar la participacion de la comunidad.",
    problem:
      "En algunas comunidades existe un acceso limitado a alimentos frescos y saludables, ademas de pocos espacios destinados a la produccion local.",
    objective:
      "Crear huertos urbanos administrados de manera colaborativa por miembros de la comunidad.",
    ods: ["ODS 2 - Hambre cero", "ODS 11 - Ciudades y comunidades sostenibles"],
    status: "En desarrollo",
    creator: "Maria Gonzalez",
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
      "Desarrollar una plataforma que permita compartir recursos y facilitar la colaboracion academica.",
    ods: ["ODS 4 - Educacion de calidad"],
    status: "Publicado",
    creator: "Carlos Ramirez",
    members: 4,
    progress: 30,
  },
  {
    id: "3",
    title: "Sistema de reciclaje universitario",
    description:
      "Proyecto orientado a mejorar la separacion y recoleccion de residuos dentro de la comunidad universitaria mediante una solucion tecnologica.",
    problem:
      "La separacion inadecuada de residuos dificulta el reciclaje y genera una mayor cantidad de desechos dentro de la institucion.",
    objective:
      "Implementar una solucion que facilite la identificacion, separacion y seguimiento de los residuos reciclables.",
    ods: ["ODS 12 - Produccion y consumo responsables"],
    status: "En desarrollo",
    creator: "Ana Martinez",
    members: 8,
    progress: 70,
  },
  {
    id: "4",
    title: "Red de colaboracion comunitaria",
    description:
      "Iniciativa que busca conectar estudiantes, docentes y organizaciones para colaborar en proyectos destinados a resolver problematicas sociales.",
    problem:
      "Existe poca conexion entre las personas que tienen conocimientos academicos y las organizaciones que enfrentan problematicas sociales.",
    objective:
      "Crear un espacio digital que facilite la formacion de equipos y la colaboracion entre distintos actores.",
    ods: ["ODS 17 - Alianzas para lograr los objetivos"],
    status: "En evaluacion",
    creator: "Luis Hernandez",
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