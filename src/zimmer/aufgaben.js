import { schichtSchluessel } from '../print/schicht.js';

/*
  Mehr Münzen (2.6.0): Tagesaufgaben und Etiketten-Münzen.

  Tagesaufgaben: je Schichttag drei aus einem Pool, für alle Geräte gleich
  ausgewählt (aus dem Datum gemischt). Jede zählt etwas, das man ohnehin
  tut – füttern, spielen, putzen, drucken – und bringt erfüllt ein paar
  Münzen. Etiketten-Münzen: die Arbeit an der Küche zahlt sich aus, mit
  Tagesgrenze, damit Testdrucke kein Münzautomat werden.
*/
export const AUFGABEN = {
  fuettern2: { titel: 'Napf zweimal füllen', zaehlt: 'fuettern', ziel: 2, lohn: 8 },
  streicheln5: { titel: '5-mal streicheln', zaehlt: 'streicheln', ziel: 5, lohn: 5 },
  spielen1: { titel: 'Ein Spiel spielen', zaehlt: 'spielen', ziel: 1, lohn: 6 },
  spielen3: { titel: 'Drei Spiele spielen', zaehlt: 'spielen', ziel: 3, lohn: 10 },
  putzen: { titel: 'Klo oder Boden sauber machen', zaehlt: 'putzen', ziel: 1, lohn: 6 },
  wasser: { titel: 'Wasser auffüllen', zaehlt: 'wasser', ziel: 1, lohn: 4 },
  drucken10: { titel: '10 Etiketten drucken', zaehlt: 'drucken', ziel: 10, lohn: 8 },
  geschenk: { titel: 'Das Geschenk öffnen', zaehlt: 'geschenk', ziel: 1, lohn: 4 },
  leckerli5: { titel: '5 Leckerlis fangen', zaehlt: 'leckerli', ziel: 5, lohn: 8 },
  maeuse5: { titel: '5 Mäuse erwischen', zaehlt: 'maeuse', ziel: 5, lohn: 8 },
};
const IDS = Object.keys(AUFGABEN);

/* Drei verschiedene Aufgaben für diesen Schichttag – auf jedem Gerät dieselben. */
export function aufgabenFuer(tag) {
  let h = 2166136261;
  for (const z of String(tag)) h = Math.imul(h ^ z.charCodeAt(0), 16777619) >>> 0;
  const rest = [...IDS];
  const wahl = [];
  for (let i = 0; i < 3; i += 1) {
    h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0;
    wahl.push(rest.splice(h % rest.length, 1)[0]);
  }
  return wahl;
}

const leer = (tag) => ({ tag, zaehler: {}, abgeholt: [] });
const heute = (stand, jetzt) => {
  const tag = schichtSchluessel(jetzt);
  return stand?.tag === tag ? stand : leer(tag);
};

export function zaehlen(stand, was, n = 1, jetzt = new Date()) {
  const s = heute(stand, jetzt);
  return { ...s, zaehler: { ...s.zaehler, [was]: (s.zaehler[was] ?? 0) + n } };
}

export const fortschritt = (stand, id) => Math.min(AUFGABEN[id].ziel, stand?.zaehler?.[AUFGABEN[id].zaehlt] ?? 0);

export const abholbar = (stand, id) => Boolean(stand) && aufgabenFuer(stand.tag).includes(id)
  && !stand.abgeholt.includes(id) && fortschritt(stand, id) >= AUFGABEN[id].ziel;

export function abholen(stand, id) {
  if (!abholbar(stand, id)) return { stand, lohn: 0 };
  return { stand: { ...stand, abgeholt: [...stand.abgeholt, id] }, lohn: AUFGABEN[id].lohn };
}

export function aufgabenLesen(roh) {
  let d;
  try { d = JSON.parse(roh); } catch { return null; }
  if (!d || typeof d.tag !== 'string') return null;
  const zaehler = Object.fromEntries(Object.entries(d.zaehler ?? {}).filter(([, v]) => Number.isFinite(v) && v >= 0));
  const abgeholt = (Array.isArray(d.abgeholt) ? d.abgeholt : []).filter((x) => typeof x === 'string');
  return { tag: d.tag, zaehler, abgeholt };
}

/* Etiketten-Münzen: 1 je gedrucktem Etikett, höchstens DRUCK.max je Schichttag. */
export const DRUCK = { max: 15 };
export function druckLohn(stand, jetzt = new Date()) {
  const tag = schichtSchluessel(jetzt);
  const bisher = stand?.tag === tag ? stand.summe : 0;
  const lohn = bisher < DRUCK.max ? 1 : 0;
  return { stand: { tag, summe: bisher + lohn }, lohn };
}
