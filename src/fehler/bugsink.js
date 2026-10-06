/*
  Fehlertracking über Bugsink (Sentry-kompatibel).

  Aufbau wie im Farmhaus-Projekt: der echte DSN bleibt auf dem Server.
  - nginx liefert unter /api/client-config nur, ob gemeldet wird, die
    Projektnummer und die Umgebung (erzeugt beim Containerstart, siehe
    docker/40-bugsink.sh).
  - Der Browser startet das SDK mit einem Platzhalter-DSN, der auf den
    eigenen Ursprung zeigt. Das SDK schickt dann an /api/<projekt>/envelope/
    beim Küchenserver, und nginx leitet mit dem echten Schlüssel weiter.
  - Bewusst OHNE die tunnel-Option des SDK: mit ihr schreibt das SDK den DSN
    in den Umschlag, und Bugsink lehnt den Platzhalter dort ab ("is not a
    valid UUID", gemessen am 06.10.2026). Ohne tunnel bleibt das Feld weg.

  Das Küchentablet muss dafür nur den Küchenserver erreichen, nicht die
  externe Bugsink-Domain, und es gibt kein CORS.

  Ohne Freigabe vom Server wird das SDK nicht einmal geladen: kein Tracking,
  kein Netzverkehr. Nur Fehler – kein Tracing, keine Sitzungen, kein Replay.
*/

export const KONFIG_PFAD = '/api/client-config';
export const DRUCK_DROSSEL_MS = 60_000;
const MERK_MAX = 50;

/* Release wie in Bugsink gruppiert: labelkitchen@<package.json-version>. */
const RELEASE = typeof __APP_RELEASE__ === 'string' ? __APP_RELEASE__ : 'labelkitchen@unbekannt';

// ── Reine Regeln (ohne Browser prüfbar) ─────────────────────────────────────

/* Nur eine eindeutige Freigabe zählt; alles andere heisst: nicht melden. */
export const leseKonfig = (roh) => {
  if (!roh || typeof roh !== 'object' || roh.enabled !== true) return null;
  const projekt = typeof roh.projekt === 'string' ? roh.projekt : '';
  if (!/^\d{1,6}$/.test(projekt)) return null;
  const environment = typeof roh.environment === 'string' && /^[a-z0-9_-]{1,32}$/.test(roh.environment)
    ? roh.environment
    : 'production';
  return { projekt, environment };
};

/* Platzhalter: eigener Ursprung, kein echter Schlüssel. nginx setzt ihn ein. */
export const platzhalterDsn = ({ protocol, host }, projekt) =>
  `${protocol}//labelkitchen@${host}/${projekt}`;

const ohneQuery = (url) => String(url).split(/[?#]/, 1)[0];

/* Ereignis vor dem Senden: kein Nutzer, Adresse ohne Query, keine Header. */
export const bereinigeEreignis = (ereignis) => {
  const aus = { ...ereignis };
  delete aus.user;
  if (aus.request) aus.request = aus.request.url !== undefined ? { url: ohneQuery(aus.request.url) } : {};
  return aus;
};

/*
  Krümel (die Spur vor dem Fehler): Konsole fällt weg, ihre Argumente können
  alles enthalten. Netzwerk nur mit Methode, Pfad und Status.
*/
export const bereinigeKruemel = (k) => {
  if (k.category === 'console') return null;
  if (k.category === 'fetch' || k.category === 'xhr') {
    const d = k.data ?? {};
    const data = {};
    if (typeof d.method === 'string') data.method = d.method;
    if (typeof d.url === 'string') data.url = ohneQuery(d.url);
    if (typeof d.status_code === 'number') data.status_code = d.status_code;
    return { ...k, data };
  }
  return k;
};

/*
  Jede neue Meldung startet in der Triage eine Claude-Routine. Ein
  streikender Drucker darf deshalb nicht bei jedem Klick melden: je Grund
  höchstens einmal pro Minute, und der Merkspeicher bleibt klein.
*/
export const sollDruckfehlerMelden = (merk, grund, jetzt = Date.now()) => {
  const zuletzt = merk.get(grund);
  if (zuletzt !== undefined && jetzt - zuletzt < DRUCK_DROSSEL_MS) return false;
  merk.delete(grund);
  merk.set(grund, jetzt);
  while (merk.size > MERK_MAX) merk.delete(merk.keys().next().value);
  return true;
};

// ── Anbindung im Browser ────────────────────────────────────────────────────

let sdk = null;
let start = null;
const druckMerk = new Map();

/*
  Startet das Fehlertracking, falls der Server es freigibt. Scheitert
  irgendetwas, läuft die App still ohne weiter – das Tracking darf den
  Etikettendruck nie behindern.
*/
export const starteFehlerberichte = () => {
  if (!start) start = starten().catch(() => false);
  return start;
};

const starten = async () => {
  let konfig;
  try {
    const antwort = await fetch(KONFIG_PFAD, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!antwort.ok) return false;
    konfig = leseKonfig(await antwort.json());
  } catch {
    return false;   // Server nicht erreichbar oder Vorschau ohne nginx
  }
  if (!konfig) return false;

  const S = await import('@sentry/react');
  S.init({
    dsn: platzhalterDsn(window.location, konfig.projekt),
    release: RELEASE,
    environment: konfig.environment,
    // SDK 11: alle Schalter stehen standardmässig auf true
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    sendClientReports: false,
    // Sitzungen sind keine Fehler und gehen nicht an Bugsink
    integrations: (standard) => standard.filter((i) => i.name !== 'BrowserSession'),
    beforeSend: bereinigeEreignis,
    beforeBreadcrumb: bereinigeKruemel,
  });
  sdk = S;
  return true;
};

/* Meldet einen Fehler, falls das SDK läuft; sonst nichts. */
export const meldeFehler = (fehler, kontext) => {
  if (sdk) sdk.captureException(fehler, kontext);
};

/*
  Druckfehler mit allem, was zur Diagnose fehlte: Als der Mehrfachdruck in
  der Küche einen Fehler warf, liess sich nie klären, woran es lag – der
  Wortlaut stand nur im roten Banner auf dem Tablet.
*/
export const meldeDruckfehler = (grund, extra = {}) => {
  if (!sdk || !sollDruckfehlerMelden(druckMerk, String(grund))) return;
  // Fester Text für die Gruppierung, das Veränderliche steht in extra
  sdk.captureException(new Error('Druckauftrag gescheitert'), {
    extra: { grund: String(grund), ...extra },
    fingerprint: ['druck', String(grund)],
  });
};
