import { FUNDSTUECKE } from './fundstuecke.js';

/*
  Neue Spiele (2.8.0): Laserpointer, Versteckspiel, Memory.
  Reine Regeln; die Spiele selbst stehen in Spiel*.jsx.
*/

const STUNDE = 3_600_000;

/* Wie lange noch bis zur nächsten Runde (für Spiele mit Münzen). */
export const abkuehlung = (zuletzt, jetzt = Date.now(), pause = STUNDE) => {
  const z = Number(zuletzt);
  if (!Number.isFinite(z) || z <= 0) return 0;
  return Math.max(0, z + pause - jetzt);
};

// ── Laserpointer: der rote Punkt, sie springt drauf ─────────────────────
export const LASER = {
  dauer: 30_000,
  fangRadius: 44,     // so nah = sie ist draufgesprungen
  laune: 2,           // je Sprung
  launeMax: 16,
};
export const gesprungen = (katze, punkt) => Math.hypot(katze.x - punkt.x, (katze.y - punkt.y) * 0.7) <= LASER.fangRadius;

// ── Versteckspiel: wo ist sie? ──────────────────────────────────────────
export const VERSTECK = { runden: 5, lohnJe: 3, schwanzNach: 3_000 };
/* Vier Verstecke in der Szene (1024 × 768), frei von Möbeln. */
export const VERSTECKE = [
  { id: 'kiste', x: 250, y: 650 },
  { id: 'vorhang', x: 420, y: 470 },
  { id: 'korb', x: 700, y: 660 },
  { id: 'pflanze', x: 900, y: 600 },
];
export function versteckWahl(alt, zufall = Math.random) {
  let i = Math.floor(zufall() * (VERSTECKE.length - 1));
  if (alt >= 0 && i >= alt) i += 1;
  return Math.min(i, VERSTECKE.length - 1);
}
export const versteckLohn = (funde) => Math.min(VERSTECK.runden, Math.max(0, funde)) * VERSTECK.lohnJe;

// ── Memory mit den Fundstücken ─────────────────────────────────────────
export const MEMORY = {
  paare: 6,
  // [höchstens so viele Züge, Münzen]
  lohn: [[8, 10], [12, 7], [Infinity, 4]],
};
export function memoryMischen(zufall = Math.random) {
  const bilder = FUNDSTUECKE.slice(0, MEMORY.paare).map((f) => f.id);
  const karten = [...bilder, ...bilder];
  for (let i = karten.length - 1; i > 0; i -= 1) {
    const j = Math.floor(zufall() * (i + 1));
    [karten[i], karten[j]] = [karten[j], karten[i]];
  }
  return karten;
}

/*
  Eine Karte antippen. Zwei offene ohne Paar bleiben kurz sichtbar und
  schliessen sich beim nächsten Tipp. Ein Zug = zwei aufgedeckte Karten.
*/
export function memoryZug(s, i) {
  if (s.gefunden.includes(i) || s.offen.includes(i)) return s;
  const offen = s.offen.length >= 2 ? [] : s.offen;
  const neuOffen = [...offen, i];
  if (neuOffen.length < 2) return { ...s, offen: neuOffen };
  const [a, b] = neuOffen;
  const zuege = s.zuege + 1;
  if (s.karten[a] === s.karten[b]) return { ...s, offen: [], gefunden: [...s.gefunden, a, b], zuege };
  return { ...s, offen: neuOffen, zuege };
}
export const memoryFertig = (s) => s.gefunden.length === s.karten.length;
export const memoryLohn = (zuege) => MEMORY.lohn.find(([max]) => zuege <= max)[1];
