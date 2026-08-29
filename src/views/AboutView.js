// views/AboutView.js
export default function AboutView() {
  return `
    <div class="card about-card">
      <header class="hero hero--narrow">
        <p class="hero__eyebrow">Acerca de</p>
        <h2 class="hero__title">Plataforma de Proyectos ODS</h2>
      </header>
      
      <p>
        <strong>Red Social Academica con Enfoque en Impacto Social</strong> es un entorno digital colaborativo 
        disenado para conectar el talento universitario y comunitario con problematicas del mundo real, 
        utilizando el Aprendizaje Basado en Proyectos (ABP) y los Objetivos de Desarrollo Sostenible (ODS) de la Agenda 2030 como ejes de colaboracion.
      </p>
      <p>
        Esta aplicacion demuestra una arquitectura modular en JavaScript Vanilla con enrutamiento del lado del cliente 
        basado en la History API, enfoque Mobile First y carga bajo demanda.
      </p>
    </div>
  `;
}