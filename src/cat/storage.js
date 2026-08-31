/*
  Kleine Speicher-Helfer für die Katze.
  Cookie und localStorage werden parallel geschrieben: Ersteres überlebt in
  manchen Kiosk-Browsern länger, Letzteres hat mehr Platz. Beides kann
  fehlschlagen (privater Modus, gesperrte Seitendaten) – dann wird still
  weitergearbeitet statt die App zu zerlegen.
*/

const ESCAPE = /([.$?*|{}()[\]\\/+^])/g;

export const getCookie = (name) => {
  try {
    const m = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(ESCAPE, '\\$1') + '=([^;]*)'),
    );
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
};

export const setCookie = (name, value, days = 30) => {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${d.toUTCString()}`;
  } catch { /* Cookies nicht verfügbar */ }
};

/* Zahl lesen: Cookie hat Vorrang, dann localStorage, sonst null. */
export const readInt = (key) => {
  const c = getCookie(key);
  if (c != null && !Number.isNaN(parseInt(c, 10))) return parseInt(c, 10);
  try {
    const saved = localStorage.getItem(key);
    return saved != null ? (parseInt(saved, 10) || 0) : null;
  } catch {
    return null;
  }
};

/* Zahl in beide Speicher schreiben. */
export const writeInt = (key, value) => {
  try { localStorage.setItem(key, String(value)); } catch { /* voll oder gesperrt */ }
  setCookie(key, String(value));
};
