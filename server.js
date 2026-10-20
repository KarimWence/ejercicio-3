import http from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const configuredBase = process.env.BASE_PATH ?? "/";
const BASE = `/${configuredBase.replace(/^\/+|\/+$/g, "")}`.replace("//", "/") || "/";
const BASE_URL = BASE === "/" ? "/" : `${BASE}/`;
const COLLABORATION_API_PATH = `${BASE === "/" ? "" : BASE}/api/collaboration-requests`;
const COLLABORATION_REQUESTS_FILE = path.join(ROOT, "data", "collaboration-requests.json");
const PORT = 5501;

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

async function handleCollaborationRequest(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    return res.end();
  }

  const chunks = [];
  let bodySize = 0;

  for await (const chunk of req) {
    bodySize += chunk.length;
    if (bodySize > 16_384) {
      res.writeHead(413);
      return res.end("Request body too large");
    }
    chunks.push(chunk);
  }

  let requestData;
  try {
    requestData = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "El cuerpo debe ser JSON válido." }));
  }

  const requiredFields = ["id", "projectId", "projectTitle", "contactName", "proposal", "createdAt"];
  const isValid = requestData && requiredFields.every(
    (field) => typeof requestData[field] === "string" && requestData[field].trim()
  );

  if (!isValid) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "Faltan datos de la propuesta." }));
  }

  try {
    let requests = [];
    try {
      requests = JSON.parse(await readFile(COLLABORATION_REQUESTS_FILE, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const existingRequest = requests.find((request) => request.id === requestData.id);
    if (existingRequest) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ id: existingRequest.id, received: true }));
    }

    requests.push({ ...requestData, receivedAt: new Date().toISOString() });
    await writeFile(COLLABORATION_REQUESTS_FILE, JSON.stringify(requests, null, 2));

    res.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ id: requestData.id, received: true }));
  } catch (error) {
    console.error("No se pudo guardar la propuesta:", error);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "No se pudo guardar la propuesta." }));
  }
}

http
  .createServer(async (req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (BASE !== "/" && pathname === BASE) {
      res.writeHead(301, { Location: BASE_URL });
      return res.end();
    }
    if (BASE !== "/" && !pathname.startsWith(`${BASE}/`)) {
      res.writeHead(404);
      return res.end("Not found");
    }

    if (pathname === COLLABORATION_API_PATH) {
      return handleCollaborationRequest(req, res);
    }

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
        // Con extensión = archivo que no existe → 404 real.
        // Sin extensión = ruta del router → se sirve el shell.
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