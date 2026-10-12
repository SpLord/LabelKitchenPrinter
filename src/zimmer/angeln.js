/*
  Angeln (2.12.0) – wie "Gold Miner": Vom Steg pendelt ein Haken hin und
  her. Tippen schiesst ihn in die gerade gezeigte Richtung. Trifft er einen
  Fisch, hängt der dran und wird hochgezogen – je schwerer, desto langsamer.
  Trifft er nichts, schnellt er leer zurück. Der Goldfisch ist selten und
  flink, der alte Schuh bringt nichts und ist schwer.

  Szene 1024 × 768; der Haken hängt bei URSPRUNG, Winkel 0 = senkrecht nach
  unten, positiv = nach rechts.
*/

export const ANGELN = {
  dauer: 60_000,
  ursprung: { x: 512, y: 170 },
  ruhe: 50,             // so lang hängt die Schnur beim Pendeln
  pendelMax: 68,        // Grad zu jeder Seite
  pendelTempo: 1.5,     // Bogenmass je Sekunde für sin()
  raus: 620,            // px/s beim Auswerfen
  leerZurueck: 900,     // px/s ohne Fang
  ziehen: 520,          // px/s mit Fang, geteilt durch das Gewicht
  wasser: { links: 40, rechts: 984, oben: 290, unten: 740 },
  fische: 8,            // so viele schwimmen gleichzeitig
  lohnMax: 15,
};

/* Was im Teich schwimmt: Wert in Punkten, Grösse, Gewicht, Tempo, Häufigkeit. */
export const FISCHE = {
  klein: { wert: 1, r: 18, gewicht: 1, tempo: 120, oft: 5 },
  mittel: { wert: 2, r: 26, gewicht: 1.6, tempo: 90, oft: 4 },
  gross: { wert: 4, r: 36, gewicht: 2.6, tempo: 60, oft: 2 },
  gold: { wert: 8, r: 20, gewicht: 1.3, tempo: 230, oft: 0.7 },
  schuh: { wert: 0, r: 24, gewicht: 2.2, tempo: 25, oft: 1.2 },
};
const ARTEN = Object.entries(FISCHE);
const RAD = Math.PI / 180;

function fischArt(zufall) {
  const summe = ARTEN.reduce((s, [, f]) => s + f.oft, 0);
  let w = zufall() * summe;
  for (const [art, f] of ARTEN) { w -= f.oft; if (w < 0) return art; }
  return 'klein';
}

/* Ein Fisch schwimmt von einer Seite herein, in seiner Tiefe hin und her. */
export function neuerFisch(id, zufall, amRand = true) {
  const art = fischArt(zufall);
  const { r, tempo } = FISCHE[art];
  const { links, rechts, oben, unten } = ANGELN.wasser;
  const richtung = zufall() < 0.5 ? -1 : 1;
  // Grosse und Gold tiefer: wer viel will, muss weit werfen
  const tiefe = art === 'gross' || art === 'gold' ? 0.55 + zufall() * 0.4 : 0.1 + zufall() * 0.8;
  const y = Math.round(oben + r + tiefe * (unten - oben - 2 * r));
  const x = amRand ? (richtung > 0 ? links - r : rechts + r) : Math.round(links + r + zufall() * (rechts - links - 2 * r));
  return { id, art, x, y, vx: richtung * tempo * (0.8 + zufall() * 0.4) };
}

export const angelStart = (zufall = Math.random) => ({
  zeit: 0,
  zustand: 'pendelt',     // pendelt | raus | zieht | zurueck
  winkel: 0,
  laenge: ANGELN.ruhe,
  fang: null,
  fische: Array.from({ length: ANGELN.fische }, (_, i) => neuerFisch(i + 1, zufall, false)),
  id: ANGELN.fische,
  punkte: 0,
  gefangen: [],
  vorbei: false,
});

export const spitze = (s) => ({
  x: ANGELN.ursprung.x + Math.sin(s.winkel * RAD) * s.laenge,
  y: ANGELN.ursprung.y + Math.cos(s.winkel * RAD) * s.laenge,
});

const imWasser = (p) => {
  const { links, rechts, unten } = ANGELN.wasser;
  return p.x > links && p.x < rechts && p.y < unten;
};

/* Ein Zeitschritt; dt in Sekunden (gekappt), werfen = in diesem Schritt getippt. */
export function angelSchritt(s, dt, werfen = false, zufall = Math.random) {
  if (s.vorbei) return s;
  const t = Math.min(0.05, Math.max(0, dt));
  const zeit = s.zeit + t;
  let { zustand, winkel, laenge, fang, punkte, gefangen } = s;

  // Fische schwimmen; wer hinausschwimmt, wird durch einen neuen ersetzt
  let id = s.id;
  const { links, rechts } = ANGELN.wasser;
  let fische = s.fische.map((f) => ({ ...f, x: f.x + f.vx * t }));
  fische = fische.map((f) => {
    const r = FISCHE[f.art].r;
    if (f.x < links - r * 2 || f.x > rechts + r * 2) { id += 1; return neuerFisch(id, zufall); }
    return f;
  });

  if (zustand === 'pendelt') {
    winkel = Math.sin(zeit * ANGELN.pendelTempo) * ANGELN.pendelMax;
    if (werfen) zustand = 'raus';
  } else if (zustand === 'raus') {
    laenge += ANGELN.raus * t;
    const p = spitze({ winkel, laenge });
    const getroffen = fische.find((f) => Math.hypot(f.x - p.x, f.y - p.y) <= FISCHE[f.art].r + 8);
    if (getroffen) {
      fang = getroffen;
      fische = fische.filter((f) => f.id !== getroffen.id);
      zustand = 'zieht';
    } else if (!imWasser(p)) {
      zustand = 'zurueck';
    }
  } else {
    const tempo = zustand === 'zieht' ? ANGELN.ziehen / FISCHE[fang.art].gewicht : ANGELN.leerZurueck;
    laenge = Math.max(ANGELN.ruhe, laenge - tempo * t);
    if (laenge <= ANGELN.ruhe) {
      if (fang) {
        punkte += FISCHE[fang.art].wert;
        gefangen = [...gefangen, fang.art];
        id += 1;
        fische = [...fische, neuerFisch(id, zufall)];
      }
      fang = null;
      zustand = 'pendelt';
    }
  }

  // Die Zeit ist um: ein Fang, der gerade hochkommt, zählt noch
  const vorbei = zeit * 1000 >= ANGELN.dauer && zustand === 'pendelt';
  return { ...s, zeit, zustand, winkel, laenge, fang, fische, id, punkte, gefangen, vorbei };
}

export const angelLohn = (punkte) => Math.min(ANGELN.lohnMax, Math.ceil(Math.max(0, punkte) / 2));
