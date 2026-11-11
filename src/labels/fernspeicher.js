import { readBackup, buildBackup } from './backup.js';

/*
  Gemeinsamer Etikettenspeicher.

  Die Liste lag bisher im localStorage genau eines Browsers – ein zweites
  Tablet sah eine andere. Hier liegt sie auf dem Server (nginx-WebDAV auf ein
  Volume), damit alle Geräte dieselbe sehen.

  Der lokale Speicher bleibt trotzdem der erste Anlaufpunkt: fällt das Netz
  aus, arbeitet die Küche weiter. Der Server ist die Wahrheit, wenn er
  erreichbar ist.

  Bewusst kein Dienst und keine Datenbank: der Bestand ist ein einziges JSON
  von rund zwei Kilobyte.
*/

export const PFAD = '/daten/etiketten.json';
const ZEITLIMIT = 4000;

const mitZeitlimit = async (pfad, optionen = {}) => {
  const abbruch = new AbortController();
  const uhr = setTimeout(() => abbruch.abort(), ZEITLIMIT);
  try {
    return await fetch(pfad, { ...optionen, signal: abbruch.signal, cache: 'no-store' });
  } finally {
    clearTimeout(uhr);
  }
};

/*
  Antwortarten:
    { zustand: 'gefunden', groups }  Server hat eine Liste
    { zustand: 'leer' }              Server erreichbar, aber noch nichts abgelegt
    { zustand: 'fehler', grund }     Server nicht erreichbar oder Inhalt unlesbar
*/
export const holen = async (fetcher = mitZeitlimit) => {
  let antwort;
  try {
    antwort = await fetcher(PFAD);
  } catch (err) {
    return { zustand: 'fehler', grund: err?.name === 'AbortError' ? 'Zeitüberschreitung' : 'nicht erreichbar' };
  }

  // 204 liefert die nginx-Regel, solange noch nie etwas abgelegt wurde
  if (antwort.status === 204 || antwort.status === 404) return { zustand: 'leer' };
  if (!antwort.ok) return { zustand: 'fehler', grund: `HTTP ${antwort.status}` };

  // Auch das Lesen des Inhalts kann abbrechen (Netz weg mitten in der
  // Antwort). Vorher lag das ausserhalb des try: die Ablehnung ging
  // unbehandelt durch und der Start-Abgleich blieb hängen.
  let text;
  try {
    text = await antwort.text();
  } catch {
    return { zustand: 'fehler', grund: 'Antwort abgebrochen' };
  }
  if (!text.trim()) return { zustand: 'leer' };

  const gelesen = readBackup(text);
  if (!gelesen.ok) return { zustand: 'fehler', grund: gelesen.error };
  return { zustand: 'gefunden', groups: gelesen.groups };
};

/* Ablegen. Gibt zurück, ob es geklappt hat – der Aufrufer entscheidet, was er meldet. */
export const ablegen = async (groups, fetcher = mitZeitlimit) => {
  try {
    const antwort = await fetcher(PFAD, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildBackup(groups), null, 2),
    });
    if (antwort.ok || antwort.status === 201 || antwort.status === 204) return { ok: true };
    return { ok: false, grund: `HTTP ${antwort.status}` };
  } catch (err) {
    return { ok: false, grund: err?.name === 'AbortError' ? 'Zeitüberschreitung' : 'nicht erreichbar' };
  }
};

/*
  Was beim Start mit der Antwort des Servers geschieht.

  ungesichert: eine Änderung auf diesem Gerät hat den Server nie erreicht
  (Netz weg beim Speichern). geaendert: während des Abgleichs wurde schon
  bearbeitet. In beiden Fällen ist der lokale Stand der neuere – vorher gewann
  trotzdem der Server, und die Änderung war beim Neuladen still weg.

  'uebernehmen' Serverstand übernehmen · 'hochladen' lokalen Stand ablegen ·
  'behalten' nichts tun (die Bearbeitung legt selbst ab) · 'lokal' Server weg
*/
export const startAbgleich = (antwort, { ungesichert = false, geaendert = false } = {}) => {
  if (antwort?.zustand !== 'gefunden' && antwort?.zustand !== 'leer') return 'lokal';
  if (geaendert) return 'behalten';
  if (ungesichert || antwort.zustand === 'leer') return 'hochladen';
  return 'uebernehmen';
};
