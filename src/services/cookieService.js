export function setCookie(name, value, days) {
  const expirationDate = new Date();

  expirationDate.setTime(
    expirationDate.getTime() + days * 24 * 60 * 60 * 1000
  );

  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)};` +
    `expires=${expirationDate.toUTCString()};` +
    `path=/;` +
    `SameSite=Lax`;
}

export function getCookie(name) {
  const encodedName = `${encodeURIComponent(name)}=`;

  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();

    if (cookie.startsWith(encodedName)) {
      return decodeURIComponent(cookie.substring(encodedName.length));
    }
  }

  return null;
}

export function deleteCookie(name) {
  document.cookie =
    `${encodeURIComponent(name)}=;` +
    `expires=Thu, 01 Jan 1970 00:00:00 GMT;` +
    `path=/;` +
    `SameSite=Lax`;
}

export function registerVisit() {
  const currentVisits = Number(getCookie("appVisits") || 0);
  const newVisits = currentVisits + 1;

  setCookie("appVisits", newVisits, 30);

  return newVisits;
}