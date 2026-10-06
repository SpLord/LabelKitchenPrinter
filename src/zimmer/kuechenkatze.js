/*
  Die Katze auf der Etikettenseite.

  Sie lebt im freien Streifen der Kopfleiste – zwischen dem letzten Knopf
  links und der Mails-Karte rechts – und läuft dort hin und her. Über die
  Etikettenknöpfe darf sie nie: genau daran ist die alte Katze gescheitert
  (Audit 2026-10-06, Tipps gingen verloren). Ist der Streifen zu schmal,
  bleibt sie lieber ganz weg.

  Reine Regeln, damit sie ohne Browser testbar sind.
*/

export const KUECHENKATZE = {
  groesse: 88,       // Kantenlänge in px
  abstand: 14,       // Luft zu Knöpfen und Karte
  bodenEinzug: 4,    // steht knapp über der Unterkante der Kopfleiste
  minZone: 110,      // schmaler → keine Katze
  tempo: 70,         // px pro Sekunde – gemütlich, nicht hektisch
  minWeg: 900,       // ms
  pauseSitzen: [5_000, 12_000],
  pauseSchlafen: 30_000,
};

/* Freier Streifen in Bildschirmkoordinaten, oder null. */
export function freieZone({ kopf, teile, karte }) {
  if (!kopf || !karte) return null;
  const sichtbar = teile.filter((t) => t.right - t.left > 0);
  const linkesEnde = sichtbar.length ? Math.max(...sichtbar.map((t) => t.right)) : kopf.left;
  const links = linkesEnde + KUECHENKATZE.abstand;
  const rechts = karte.left - KUECHENKATZE.abstand;
  if (rechts - links < KUECHENKATZE.minZone) return null;
  return { links, rechts, boden: kopf.bottom - KUECHENKATZE.bodenEinzug };
}

const zwischen = ([von, bis], z) => von + (bis - von) * z;

/*
  Was sie als Nächstes tut. lage: { nacht, krank }, x: Mitte der Katze jetzt.
  Ergebnis: { art: laufen|sitzen|schlafen|liegen, x, dauer } – dauer ist bei
  laufen die Wegzeit, sonst die Pause bis zur nächsten Entscheidung.
*/
export function naechsterSchritt({ nacht, krank }, zone, x, zufall = Math.random) {
  if (krank) return { art: 'liegen', x, dauer: KUECHENKATZE.pauseSchlafen };
  if (nacht) return { art: 'schlafen', x, dauer: KUECHENKATZE.pauseSchlafen };

  const halb = KUECHENKATZE.groesse / 2;
  const min = zone.links + halb;
  const max = zone.rechts - halb;
  const z = zufall();
  if (max <= min) {
    return { art: 'sitzen', x: (zone.links + zone.rechts) / 2, dauer: zwischen(KUECHENKATZE.pauseSitzen, z) };
  }
  if (z < 0.35) return { art: 'sitzen', x, dauer: zwischen(KUECHENKATZE.pauseSitzen, z / 0.35) };

  // Ziel: ein anderer Punkt der Zone, nicht direkt neben ihr
  const ziel = Math.round(min + (max - min) * ((z - 0.35) / 0.65));
  const dauer = Math.max(KUECHENKATZE.minWeg, (Math.abs(ziel - x) / KUECHENKATZE.tempo) * 1000);
  return { art: 'laufen', x: ziel, dauer };
}

/* Welche Denkblase sie zeigt – dieselbe Reihenfolge wie die Karte. */
export function blaseFuer({ krank, bedarf }) {
  if (krank || bedarf.includes('krank')) return 'krank';
  if (bedarf.includes('durst')) return 'durst';
  if (bedarf.includes('hunger')) return 'hunger';
  return null;
}
