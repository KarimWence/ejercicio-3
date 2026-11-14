import {
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "../utils/storage.js";
import { withBackendUrl } from "../config.js";

const AUTH_TOKEN_KEY = "auth-token";
const AUTH_USER_KEY = "auth-user";

function getErrorMessage(data, fallback) {
  return data?.error || fallback;
}

async function request(path, options = {}) {
  const response = await fetch(withBackendUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "No fue posible completar la solicitud."));
  }

  return data;
}

function saveSession({ token, user }) {
  writeStorageItem("localStorage", AUTH_TOKEN_KEY, token);
  writeStorageItem("localStorage", AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthToken() {
  return readStorageItem("localStorage", AUTH_TOKEN_KEY);
}

export function getCurrentUser() {
  const savedUser = readStorageItem("localStorage", AUTH_USER_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

export function clearSession() {
  removeStorageItem("localStorage", AUTH_TOKEN_KEY);
  removeStorageItem("localStorage", AUTH_USER_KEY);
}

export async function registerUser({ name, email, password }) {
  const session = await request("api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  saveSession(session);
  return session.user;
}

export async function loginUser({ email, password }) {
  const session = await request("api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  saveSession(session);
  return session.user;
}

export async function validateSession() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const data = await request("api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    writeStorageItem("localStorage", AUTH_USER_KEY, JSON.stringify(data.user));
    return data.user;
  } catch {
    clearSession();
    return null;
  }
}
