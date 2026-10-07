/*
  Katzenklo und Häufchen (Design 2026-10-06, Etappe 3).

  Etwa alle vier Stunden muss sie. Steht ein Klo da und hat es Platz, geht
  sie drauf – sonst landet ein Häufchen auf dem Boden und drückt die Laune.
  Wer putzt, bekommt ein paar Münzen, aber nur bis zur Tagesgrenze: Putzen
  soll Pflege sein, keine Münzquelle.

  Gänge laufen nach der Uhr, nicht nach dem Bildschirm. Ist das Zimmer offen,
  läuft sie sichtbar zum Klo; schafft sie es nicht binnen der Gnadenfrist
  (Zimmer zu, Tablet aus), wird der Gang trotzdem verbucht – so liegt nach
  dem Wochenende auch etwas da, wenn niemand zugesehen hat.

  Reine Funktionen, jede gibt einen neuen Zustand zurück.
*/

const STUNDE = 3_600_000;

export const KLO = {
  abstand: 4 * STUNDE,
  gnade: 10 * 60_000,     // so lange darf sie selbst hingehen
  kapazitaet: 3,          // Gänge, bis das Klo voll ist
  maxHaeufchen: 4,
  abstandHaeufchen: 80,
  bodenUnten: 652,        // tiefer verdeckt sie die Menüleiste
  // Immer: Napf, Wasser, Klo (einrichtung.js). Was nur manchmal dasteht
  // (Geschenk, Katzengras), gibt der Aufrufer als `meiden` mit.
  meiden: [{ x: 470, y: 602 }, { x: 590, y: 606 }, { x: 106, y: 668 }],
  abstandMoebel: 85,   // so weit auseinander, dass jedes antippbar bleibt
  lohnKlo: 3,
  lohnHaeufchen: 2,
  tagesGrenze: 30,
  preis: 150,
};

/* Boden der Szene, auf dem Häufchen landen können (wie verhalten.js). */
// Unten endet der sichtbare Boden: ab ~672 liegt die Menüleiste darüber
const BODEN = { links: 200, rechts: 940, oben: 592, unten: 652 };

export const leer = (jetzt) => ({ letzterGang: jetzt, klo: 0, haeufchen: [], putzen: { tag: '', summe: 0 } });

const zahl = (n, min, max, ersatz) => (Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : ersatz);

/* Gespeicherten Zustand prüfen – alles Fremde fällt auf frisch zurück. */
export function lesen(roh, jetzt) {
  if (!roh) return leer(jetzt);
  let d;
  try { d = JSON.parse(roh); } catch { return leer(jetzt); }
  if (!d || typeof d !== 'object') return leer(jetzt);
  const haeufchen = (Array.isArray(d.haeufchen) ? d.haeufchen : [])
    .filter((h) => h && typeof h.id === 'string' && Number.isFinite(h.x) && Number.isFinite(h.y))
    .slice(0, KLO.maxHaeufchen)
    .map(({ id, x, y }) => ({ id, x, y }));
  const putzen = d.putzen && typeof d.putzen.tag === 'string'
    ? { tag: d.putzen.tag, summe: zahl(d.putzen.summe, 0, KLO.tagesGrenze, 0) }
    : { tag: '', summe: 0 };
  return {
    letzterGang: zahl(d.letzterGang, 0, jetzt, jetzt),
    klo: zahl(d.klo, 0, KLO.kapazitaet, 0),
    haeufchen,
    putzen,
  };
}

export const faellig = (z, jetzt) => jetzt - z.letzterGang >= KLO.abstand;

const bodenOrt = (zufall) => ({
  x: Math.round(BODEN.links + zufall() * (BODEN.rechts - BODEN.links)),
  y: Math.round(BODEN.oben + zufall() * (BODEN.unten - BODEN.oben)),
});

const frei = (ort, haeufchen, meiden = []) =>
  haeufchen.every((h) => Math.hypot(h.x - ort.x, h.y - ort.y) >= KLO.abstandHaeufchen)
  && [...KLO.meiden, ...meiden].every((m) => Math.hypot(m.x - ort.x, m.y - ort.y) >= KLO.abstandMoebel);

/*
  Wo das Häufchen landet: an ihrer Stelle, wenn dort Platz ist, sonst an
  einem freien Zufallsplatz. Findet der Zufall nichts, sucht ein Raster den
  ersten freien Punkt – damit nie zwei übereinander liegen.
*/
const aufDenBoden = (ort) => ort && ({
  x: Math.max(BODEN.links, Math.min(BODEN.rechts, ort.x)),
  y: Math.max(BODEN.oben, Math.min(BODEN.unten, ort.y)),
});

function landeplatz(roh, haeufchen, zufall, meiden = []) {
  const wunsch = aufDenBoden(roh);
  if (wunsch && frei(wunsch, haeufchen, meiden)) return wunsch;
  for (let i = 0; i < 24; i += 1) {
    const ort = bodenOrt(zufall);
    if (frei(ort, haeufchen, meiden)) return ort;
  }
  // Raster über den ganzen Boden, erster freier Punkt gewinnt
  for (let y = BODEN.oben; y <= BODEN.unten; y += 30) {
    for (let x = BODEN.links; x <= BODEN.rechts; x += 40) {
      if (frei({ x, y }, haeufchen, meiden)) return { x, y };
    }
  }
  return null;   // Boden voll: lieber keins mehr als eins über dem anderen
}

let laufend = 0;
const neueId = (jetzt) => `h${jetzt.toString(36)}${(laufend++).toString(36)}`;

/*
  Ein Gang. ort: wo sie gerade steht (sonst ein Zufallsplatz auf dem Boden).
  Volles oder fehlendes Klo → Häufchen, höchstens maxHaeufchen.
*/
export function gang(z, { hatKlo, jetzt, ort = null, zufall = Math.random, meiden = [] }) {
  if (hatKlo && z.klo < KLO.kapazitaet) return { ...z, klo: z.klo + 1, letzterGang: jetzt };
  if (z.haeufchen.length >= KLO.maxHaeufchen) return { ...z, letzterGang: jetzt };
  const wo = landeplatz(ort, z.haeufchen, zufall, meiden);
  if (!wo) return { ...z, letzterGang: jetzt };
  return {
    ...z,
    letzterGang: jetzt,
    haeufchen: [...z.haeufchen, { id: neueId(jetzt), x: Math.round(wo.x), y: Math.round(wo.y) }],
  };
}

/*
  Verpasste Gänge verbuchen: jeder, dessen Zeit samt Gnadenfrist vorbei ist.
  Nach langer Abwesenheit höchstens so viele, wie Klo und Boden fassen – die
  Uhr springt dann auf den letzten fälligen Zeitpunkt vor jetzt.
*/
export function nachholen(z, { hatKlo, jetzt, zufall = Math.random, meiden = [] }) {
  const vorbei = jetzt - z.letzterGang - KLO.gnade;
  if (vorbei < KLO.abstand) return z;
  const anzahl = Math.floor(vorbei / KLO.abstand);
  const hoechstens = KLO.kapazitaet + KLO.maxHaeufchen;
  let neu = z;
  for (let i = 1; i <= Math.min(anzahl, hoechstens); i += 1) {
    neu = gang(neu, { hatKlo, jetzt: z.letzterGang + i * KLO.abstand, zufall, meiden });
  }
  return { ...neu, letzterGang: z.letzterGang + anzahl * KLO.abstand };
}

/* Lohn innerhalb der Tagesgrenze verbuchen. */
const verdienen = (z, basis, tag) => {
  const bisher = z.putzen.tag === tag ? z.putzen.summe : 0;
  const lohn = Math.max(0, Math.min(basis, KLO.tagesGrenze - bisher));
  return { putzen: { tag, summe: bisher + lohn }, lohn };
};

export function kloLeeren(z, tag) {
  if (z.klo <= 0) return { zustand: z, lohn: 0 };
  const { putzen, lohn } = verdienen(z, KLO.lohnKlo, tag);
  return { zustand: { ...z, klo: 0, putzen }, lohn };
}

export function haeufchenWeg(z, id, tag) {
  if (!z.haeufchen.some((h) => h.id === id)) return { zustand: z, lohn: 0 };
  const { putzen, lohn } = verdienen(z, KLO.lohnHaeufchen, tag);
  return { zustand: { ...z, haeufchen: z.haeufchen.filter((h) => h.id !== id), putzen }, lohn };
}
