import http from "node:http";
import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import webpush from "web-push";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const configuredBase = process.env.BASE_PATH ?? "/";
const BASE = `/${configuredBase.replace(/^\/+|\/+$/g, "")}`.replace("//", "/") || "/";
const BASE_URL = BASE === "/" ? "/" : `${BASE}/`;
const API_PREFIX = BASE === "/" ? "/api" : `${BASE}/api`;
const COLLABORATION_API_PATH = `${API_PREFIX}/collaboration-requests`;
const AUTH_REGISTER_PATH = `${API_PREFIX}/auth/register`;
const AUTH_LOGIN_PATH = `${API_PREFIX}/auth/login`;
const AUTH_ME_PATH = `${API_PREFIX}/auth/me`;
const PUSH_PUBLIC_KEY_PATH = `${API_PREFIX}/push/public-key`;
const PUSH_SUBSCRIBE_PATH = `${API_PREFIX}/push/subscribe`;
const COLLABORATION_REQUESTS_FILE = path.join(ROOT, "data", "collaboration-requests.json");
const USERS_FILE = path.join(ROOT, "data", "users.json");
const PORT = Number(process.env.PORT) || 5501;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const scryptAsync = promisify(scrypt);

// En producción debe configurarse como secreto en Render. El valor temporal solo
// facilita las pruebas locales y hace que las sesiones caduquen al reiniciar.
const AUTH_SECRET = process.env.AUTH_SECRET || randomBytes(32).toString("hex");
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "";

if (!process.env.AUTH_SECRET) {
  console.warn("[Auth] AUTH_SECRET no está definido; se usa una clave temporal solo para desarrollo.");
}

const pushIsConfigured = Boolean(
  VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT
);

if (pushIsConfigured) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn("[Push] Faltan variables VAPID; las notificaciones Push no están disponibles.");
}

const database = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function applyCors(req, res) {
  const origin = req.headers.origin;

  if (FRONTEND_ORIGIN && origin === FRONTEND_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
}

async function readRequestJson(req) {
  const chunks = [];
  let bodySize = 0;

  for await (const chunk of req) {
    bodySize += chunk.length;

    if (bodySize > 16_384) {
      const error = new Error("Request body too large");
      error.status = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("El cuerpo debe ser JSON válido.");
    error.status = 400;
    throw error;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function readJsonFile(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function initializeDatabase() {
  if (!database) return;

  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      email VARCHAR(160) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS collaboration_requests (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      project_id TEXT NOT NULL,
      project_title TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      proposal TEXT NOT NULL,
      meeting_area TEXT,
      device_location TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function findUserByEmail(email) {
  if (database) {
    const result = await database.query(
      "SELECT id, name, email, password_hash AS \"passwordHash\" FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0] || null;
  }

  const users = await readJsonFile(USERS_FILE);
  return users.find((user) => user.email === email) || null;
}

async function findUserById(id) {
  if (database) {
    const result = await database.query(
      "SELECT id, name, email, password_hash AS \"passwordHash\" FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  const users = await readJsonFile(USERS_FILE);
  return users.find((user) => user.id === id) || null;
}

async function createUser(user) {
  if (database) {
    await database.query(
      "INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)",
      [user.id, user.name, user.email, user.passwordHash]
    );
    return;
  }

  const users = await readJsonFile(USERS_FILE);
  users.push(user);
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function saveCollaborationRequest(requestData) {
  if (database) {
    const result = await database.query(
      `INSERT INTO collaboration_requests (
        id, user_id, project_id, project_title, contact_name, proposal,
        meeting_area, device_location, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
      RETURNING id`,
      [
        requestData.id,
        requestData.userId,
        requestData.projectId,
        requestData.projectTitle,
        requestData.contactName,
        requestData.proposal,
        requestData.meetingArea || null,
        requestData.deviceLocation || null,
        requestData.createdAt,
      ]
    );
    return result.rowCount > 0;
  }

  const requests = await readJsonFile(COLLABORATION_REQUESTS_FILE);

  if (!requests.some((request) => request.id === requestData.id)) {
    requests.push({ ...requestData, receivedAt: new Date().toISOString() });
    await writeFile(COLLABORATION_REQUESTS_FILE, JSON.stringify(requests, null, 2));
    return true;
  }

  return false;
}

function requirePushDatabase(res) {
  if (!database) {
    sendJson(res, 503, {
      error: "Las suscripciones Push requieren la base de datos configurada en el backend.",
    });
    return false;
  }

  if (!pushIsConfigured) {
    sendJson(res, 503, {
      error: "Las llaves VAPID no están configuradas en el backend.",
    });
    return false;
  }

  return true;
}

function getSubscriptionData(subscription) {
  const endpoint = String(subscription?.endpoint || "");
  const p256dh = String(subscription?.keys?.p256dh || "");
  const auth = String(subscription?.keys?.auth || "");

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  try {
    new URL(endpoint);
  } catch {
    return null;
  }

  return { endpoint, p256dh, auth };
}

async function savePushSubscription(userId, subscription) {
  await database.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth`,
    [userId, subscription.endpoint, subscription.p256dh, subscription.auth]
  );
}

async function removePushSubscription(userId, endpoint) {
  await database.query(
    "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
    [userId, endpoint]
  );
}

async function sendPushForCollaboration(userId, projectTitle) {
  if (!database || !pushIsConfigured) {
    return;
  }

  const result = await database.query(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1",
    [userId]
  );
  const payload = JSON.stringify({
    title: "Propuesta recibida",
    body: `Tu propuesta para ${projectTitle} fue recibida correctamente.`,
    tag: "collaboration-received",
    url: "#/colaborar",
  });

  await Promise.all(
    result.rows.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 300 }
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await database.query(
            "DELETE FROM push_subscriptions WHERE endpoint = $1",
            [subscription.endpoint]
          );
          console.log("[Push] Suscripción eliminada por estar vencida.");
          return;
        }

        // Los errores del servicio Push, incluidos 429, no afectan el registro.
        console.warn("[Push] No se pudo enviar una notificación:", error.statusCode || error.message);
      }
    })
  );
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedKey] = String(storedHash).split(":");

  if (!salt || !expectedKey) return false;

  const derivedKey = Buffer.from(await scryptAsync(password, salt, 64));
  const expectedBuffer = Buffer.from(expectedKey, "hex");

  return (
    derivedKey.length === expectedBuffer.length &&
    timingSafeEqual(derivedKey, expectedBuffer)
  );
}

function createToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS })
  ).toString("base64url");
  const signature = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const [payload, signature] = String(token || "").split(".");

  if (!payload || !signature) return null;

  const expectedSignature = createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const tokenData = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!tokenData.sub || tokenData.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return tokenData;
  } catch {
    return null;
  }
}

async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const tokenData = verifyToken(token);

  if (!tokenData) return null;
  return findUserById(tokenData.sub);
}

async function handleRegister(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    return res.end();
  }

  try {
    const body = await readRequestJson(req);
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!name || !email.includes("@") || password.length < 8) {
      return sendJson(res, 400, {
        error: "Ingresa nombre, un correo válido y una contraseña de al menos 8 caracteres.",
      });
    }

    if (await findUserByEmail(email)) {
      return sendJson(res, 409, { error: "Ya existe una cuenta con ese correo." });
    }

    const user = {
      id: randomUUID(),
      name: name.slice(0, 80),
      email: email.slice(0, 160),
      passwordHash: await hashPassword(password),
    };
    await createUser(user);

    return sendJson(res, 201, {
      token: createToken(user.id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("No se pudo registrar la cuenta:", error);
    return sendJson(res, error.status || 500, {
      error: error.status ? error.message : "No se pudo crear la cuenta.",
    });
  }
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    return res.end();
  }

  try {
    const body = await readRequestJson(req);
    const user = await findUserByEmail(normalizeEmail(body.email));
    const isValidPassword = user && await verifyPassword(String(body.password || ""), user.passwordHash);

    if (!isValidPassword) {
      return sendJson(res, 401, { error: "Correo o contraseña incorrectos." });
    }

    return sendJson(res, 200, {
      token: createToken(user.id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("No se pudo iniciar sesión:", error);
    return sendJson(res, error.status || 500, {
      error: error.status ? error.message : "No se pudo iniciar sesión.",
    });
  }
}

async function handleCurrentUser(req, res) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return sendJson(res, 401, { error: "La sesión no es válida o expiró." });
  }

  return sendJson(res, 200, { user: sanitizeUser(user) });
}

async function handlePushPublicKey(req, res) {
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    return res.end();
  }

  if (!pushIsConfigured) {
    return sendJson(res, 503, {
      error: "Las llaves VAPID no están configuradas en el backend.",
    });
  }

  return sendJson(res, 200, { publicKey: VAPID_PUBLIC_KEY });
}

async function handlePushSubscription(req, res) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return sendJson(res, 401, { error: "Inicia sesión para administrar notificaciones Push." });
  }

  if (!requirePushDatabase(res)) {
    return;
  }

  try {
    if (req.method === "POST") {
      const body = await readRequestJson(req);
      const subscription = getSubscriptionData(body.subscription);

      if (!subscription) {
        return sendJson(res, 400, { error: "La suscripción Push no es válida." });
      }

      await savePushSubscription(user.id, subscription);
      return sendJson(res, 201, { subscribed: true });
    }

    if (req.method === "DELETE") {
      const body = await readRequestJson(req);
      const endpoint = String(body.endpoint || "");

      if (!endpoint) {
        return sendJson(res, 400, { error: "Indica la suscripción que deseas eliminar." });
      }

      await removePushSubscription(user.id, endpoint);
      return sendJson(res, 200, { subscribed: false });
    }

    res.writeHead(405, { Allow: "POST, DELETE" });
    return res.end();
  } catch (error) {
    console.error("No se pudo administrar la suscripción Push:", error);
    return sendJson(res, error.status || 500, {
      error: error.status ? error.message : "No se pudo guardar la suscripción Push.",
    });
  }
}

async function handleCollaborationRequest(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    return res.end();
  }

  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return sendJson(res, 401, { error: "Inicia sesión para enviar una propuesta." });
    }

    const requestData = await readRequestJson(req);
    const requiredFields = ["id", "projectId", "projectTitle", "contactName", "proposal", "createdAt"];
    const isValid = requestData && requiredFields.every(
      (field) => typeof requestData[field] === "string" && requestData[field].trim()
    );

    if (!isValid) {
      return sendJson(res, 400, { error: "Faltan datos de la propuesta." });
    }

    const wasCreated = await saveCollaborationRequest({
      ...requestData,
      userId: user.id,
    });

    if (wasCreated) {
      await sendPushForCollaboration(user.id, requestData.projectTitle);
    }

    return sendJson(res, 201, { id: requestData.id, received: true });
  } catch (error) {
    console.error("No se pudo guardar la propuesta:", error);
    return sendJson(res, error.status || 500, {
      error: error.status ? error.message : "No se pudo guardar la propuesta.",
    });
  }
}

await initializeDatabase();

http
  .createServer(async (req, res) => {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (BASE !== "/" && pathname === BASE) {
      res.writeHead(301, { Location: BASE_URL });
      return res.end();
    }
    if (BASE !== "/" && !pathname.startsWith(`${BASE}/`)) {
      res.writeHead(404);
      return res.end("Not found");
    }

    if (pathname === AUTH_REGISTER_PATH) return handleRegister(req, res);
    if (pathname === AUTH_LOGIN_PATH) return handleLogin(req, res);
    if (pathname === AUTH_ME_PATH) return handleCurrentUser(req, res);
    if (pathname === PUSH_PUBLIC_KEY_PATH) return handlePushPublicKey(req, res);
    if (pathname === PUSH_SUBSCRIBE_PATH) return handlePushSubscription(req, res);
    if (pathname === COLLABORATION_API_PATH) return handleCollaborationRequest(req, res);

    const rel = decodeURIComponent(pathname.slice(BASE.length));
    let target = path.join(ROOT, path.normalize(rel));

    if (!target.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    try {
      const info = await stat(target).catch(() => null);

      if (info?.isDirectory()) {
        target = path.join(target, "index.html");
      } else if (!info) {
        if (path.extname(rel)) throw new Error("404");
        target = path.join(ROOT, "index.html");
      }

      const data = await readFile(target);
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(target)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}${BASE_URL}`));
