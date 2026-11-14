import { getCurrentUser } from "../services/authService.js";

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export default function AccountView() {
  const user = getCurrentUser();

  if (user) {
    return `
      <header class="hero hero--narrow">
        <p class="hero__eyebrow">Cuenta</p>
        <h2 class="hero__title">Sesión iniciada</h2>
        <p class="hero__subtitle">Tu identificador se usa para asociar tus propuestas y suscripciones de notificaciones.</p>
      </header>
      <section class="card account-card">
        <p><strong>Nombre:</strong> ${escapeHTML(user.name)}</p>
        <p><strong>Correo:</strong> ${escapeHTML(user.email)}</p>
        <p><strong>ID de usuario:</strong> <code>${escapeHTML(user.id)}</code></p>
        <button type="button" class="diagnostic-button" data-logout>Salir de la cuenta</button>
      </section>
    `;
  }

  return `
    <header class="hero hero--narrow">
      <p class="hero__eyebrow">Cuenta</p>
      <h2 class="hero__title">Regístrate o inicia sesión</h2>
      <p class="hero__subtitle">La cuenta permite asociar tus propuestas y futuras suscripciones Push a un user_id.</p>
    </header>

    <div class="account-grid">
      <form id="register-form" class="project-form account-form">
        <h3>Crear cuenta</h3>
        <div class="form-group">
          <label for="register-name">Nombre</label>
          <input id="register-name" name="name" type="text" maxlength="80" autocomplete="name" required />
        </div>
        <div class="form-group">
          <label for="register-email">Correo</label>
          <input id="register-email" name="email" type="email" maxlength="160" autocomplete="email" required />
        </div>
        <div class="form-group">
          <label for="register-password">Contraseña</label>
          <input id="register-password" name="password" type="password" minlength="8" autocomplete="new-password" required />
        </div>
        <button type="submit">Crear cuenta</button>
      </form>

      <form id="login-form" class="project-form account-form">
        <h3>Iniciar sesión</h3>
        <div class="form-group">
          <label for="login-email">Correo</label>
          <input id="login-email" name="email" type="email" maxlength="160" autocomplete="email" required />
        </div>
        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <input id="login-password" name="password" type="password" autocomplete="current-password" required />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  `;
}
