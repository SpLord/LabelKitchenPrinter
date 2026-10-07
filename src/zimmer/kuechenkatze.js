/*
  Die Katze auf der Etikettenseite.

  Sie lebt im freien Streifen der Kopfleiste – zwischen dem letzten Knopf
  links und der Katzenkarte rechts – und läuft dort hin und her. Über die
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
  randUnten: 10,     // Abstand des Bodens zum unteren Bildschirmrand
  sprungChance: 0.25,
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

/*
  Freie Böden (2.2.0): Unter kürzeren Spalten bleibt bis zum unteren
  Bildschirmrand Platz – dort darf sie auch hin. Nur wenn die Lücke hoch und
  breit genug ist und nichts anderes darin liegt (Fehlermeldung,
  Versionsanzeige, Seitenleiste).
*/
const schneidet = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export function freieBoeden({ fenster, spalten, hindernisse }) {
  const boeden = [];
  spalten.forEach((s, i) => {
    const oben = Math.max(0, s.bottom + KUECHENKATZE.abstand);
    const boden = fenster.hoehe - KUECHENKATZE.randUnten;
    const links = s.left + KUECHENKATZE.abstand;
    const rechts = s.right - KUECHENKATZE.abstand;
    if (boden - oben < KUECHENKATZE.groesse + 12) return;
    if (rechts - links < KUECHENKATZE.minZone) return;
    const flaeche = { left: links, right: rechts, top: boden - KUECHENKATZE.groesse - 12, bottom: boden };
    if (hindernisse.some((h) => schneidet(flaeche, h))) return;
    boeden.push({ id: `boden-${i}`, links, rechts, boden });
  });
  return boeden;
}

/* Auf welcher Ebene geht es weiter? Meist dieselbe, manchmal ein Sprung. */
export function waehleEbene(ebenen, aktuell, zufall = Math.random) {
  const hier = ebenen.find((e) => e.id === aktuell);
  const andere = ebenen.filter((e) => e.id !== aktuell);
  if (!hier) return ebenen[0] ?? null;
  if (!andere.length) return hier;
  const z = zufall();
  if (z >= KUECHENKATZE.sprungChance) return hier;
  return andere[Math.min(andere.length - 1, Math.floor((z / KUECHENKATZE.sprungChance) * andere.length))];
}

/* Was sie sagt, wenn ein Etikett gedruckt wird – kurz, damit die Blase klein bleibt. */
const SPRUECHE = ['{n}? Lecker!', 'Mjam, {n}!', '{n} – für mich?', 'Noch ein {n}!'];
export function spruchZumEtikett(name, zufall = Math.random) {
  const n = String(name ?? '').trim();
  if (!n) return 'Mjam!';
  const kurz = n.length > 14 ? `${n.slice(0, 13)}…` : n;
  const vorlage = SPRUECHE[Math.min(SPRUECHE.length - 1, Math.floor(zufall() * SPRUECHE.length))];
  return vorlage.replace('{n}', kurz);
}
