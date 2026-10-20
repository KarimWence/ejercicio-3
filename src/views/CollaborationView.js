import PublicationsService from "../services/itemsService.js";
import { getOutboxItems } from "../services/dbService.js";
import { withBasePath } from "../config.js";

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export default async function CollaborationView() {
  const service = new PublicationsService();
  const [projects, outboxItems] = await Promise.all([
    service.getAll(),
    getOutboxItems(),
  ]);
  const pendingItems = outboxItems
    .filter((item) => item.type === "collaboration-request")
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  const endpoint = withBasePath("api/collaboration-requests");

  return `
    <header class="hero hero--narrow">
      <p class="hero__eyebrow">Colaboración</p>
      <h2 class="hero__title">Propón una colaboración</h2>
      <p class="hero__subtitle">Comparte cómo te gustaría participar en un proyecto de impacto social.</p>
    </header>

    <form id="collaboration-form" class="project-form collaboration-form">
      <div class="form-group">
        <label for="collaboration-project">Proyecto</label>
        <select id="collaboration-project" name="projectId" required>
          <option value="" disabled selected>Selecciona un proyecto</option>
          ${projects.map((project) => `
            <option value="${escapeHTML(project.id)}">${escapeHTML(project.title)}</option>
          `).join("")}
        </select>
      </div>
      <div class="form-group">
        <label for="collaboration-name">Tu nombre</label>
        <input id="collaboration-name" name="contactName" type="text" maxlength="80" autocomplete="name" required />
      </div>
      <div class="form-group">
        <label for="collaboration-proposal">¿Cómo te gustaría colaborar?</label>
        <textarea id="collaboration-proposal" name="proposal" maxlength="1200" required></textarea>
      </div>
      <button type="submit">Guardar propuesta</button>
    </form>

    <section class="outbox-section" aria-labelledby="outbox-title">
      <div class="outbox-section__heading">
        <h2 id="outbox-title">Cola de propuestas</h2>
        <span class="outbox-count">${pendingItems.length} pendiente${pendingItems.length === 1 ? "" : "s"}</span>
      </div>
      ${pendingItems.length ? `
        <ul class="outbox-list">
          ${pendingItems.map((item) => {
            const payload = item.payload ?? {};
            const createdAt = new Date(item.createdAt).toLocaleString("es-MX");

            return `
              <li class="outbox-item">
                <div>
                  <h3>${escapeHTML(payload.projectTitle || "Propuesta de colaboración")}</h3>
                  <p>${escapeHTML(payload.contactName || "")}: ${escapeHTML(payload.proposal || "")}</p>
                  <time datetime="${escapeHTML(item.createdAt)}">${escapeHTML(createdAt)}</time>
                </div>
                <span class="outbox-status">Pendiente de envío</span>
              </li>
            `;
          }).join("")}
        </ul>
      ` : `
        <p class="outbox-empty">Todavía no hay propuestas en la cola.</p>
      `}
    </section>
  `;
}