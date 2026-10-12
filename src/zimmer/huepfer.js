/*
  Gurkenhüpfer (2.12.0): ein Lauf-und-Spring-Spiel.

  Sie rennt nach rechts, das Zimmer zieht vorbei. Tippen lässt sie springen,
  in der Luft geht noch ein zweiter Sprung. Über Gurken, Staubsauger und
  Kartons muss sie drüber; Münzen in der Luft sammelt sie ein. Es wird mit
  der Zeit schneller. Ein Zusammenstoss beendet den Lauf.

  Reine Physik ohne Browser: schritt() rechnet einen Zeitschritt, der Zufall
  kommt von aussen. Höhen in Szenenpunkten über dem Boden.
*/

export const HUEPFER = {
  katzeX: 220,           // hier rennt sie, das Zimmer bewegt sich
  boden: 640,            // Szenenhöhe ihrer Pfoten
  schwere: 2600,         // px/s²
  sprung: 900,           // Startgeschwindigkeit eines Sprungs (px/s)
  spruenge: 2,           // Doppelsprung
  tempo: 330,            // px/s am Anfang …
  beschleunigung: 9,     // … und so viel schneller je Sekunde
  tempoMax: 720,
  breite: 56,            // ihr Trefferkasten
  hoehe: 54,
  muenzeRadius: 38,
  lohnMax: 15,
  meterJeMuenze: 25,     // je 25 m eine Münze obendrauf
};

/* Hindernisse: Breite und Höhe in Szenenpunkten. */
export const HINDERNISSE = {
  gurke: { b: 64, h: 30 },
  karton: { b: 74, h: 62 },
  staubsauger: { b: 64, h: 92 },
};
const ARTEN = Object.keys(HINDERNISSE);

export const huepferStart = () => ({
  zeit: 0,
  strecke: 0,
  tempo: HUEPFER.tempo,
  katze: { y: 0, vy: 0, spruenge: 0 },
  hindernisse: [],
  muenzen: [],
  gesammelt: 0,
  naechstes: 520,        // Abstand bis zum ersten Hindernis
  id: 0,
  vorbei: false,
});

/* Abstand bis zum nächsten Hindernis: nie kürzer, als sie in einem Sprung schafft. */
const abstand = (tempo, zufall) => Math.round(tempo * (0.95 + zufall() * 1.15) + 90);

function neueSachen(s, zufall) {
  const art = s.zeit < 6 ? 'gurke' : ARTEN[Math.min(ARTEN.length - 1, Math.floor(zufall() * ARTEN.length))];
  const id = s.id + 1;
  const x = 1100;
  const hindernisse = [...s.hindernisse, { id, x, art }];
  // Über manchen Hindernissen schwebt ein Münzbogen – Anreiz zum hohen Sprung
  const bogen = zufall() < 0.6;
  const muenzen = bogen
    ? [...s.muenzen, ...[-60, 0, 60].map((dx, i) => ({ id: id * 10 + i, x: x + dx, hoehe: HINDERNISSE[art].h + 70 + (i === 1 ? 40 : 0) }))]
    : s.muenzen;
  return { ...s, id, hindernisse, muenzen, naechstes: abstand(s.tempo, zufall) };
}

const stoesst = (katze, o) => {
  const { b, h } = HINDERNISSE[o.art];
  // Etwas Nachsicht an den Kanten: knapp vorbei zählt nicht als Treffer
  const nebeneinander = Math.abs(o.x - HUEPFER.katzeX) < (b + HUEPFER.breite) / 2 - 10;
  return nebeneinander && katze.y < h - 8;
};
const erwischt = (katze, m) =>
  Math.hypot(m.x - HUEPFER.katzeX, m.hoehe - (katze.y + HUEPFER.hoehe / 2)) <= HUEPFER.muenzeRadius + 12;

/*
  Ein Zeitschritt. dt in Sekunden (wird auf 50 ms gekappt, damit ein Ruckler
  sie nicht durch ein Hindernis "beamt"). springen: in diesem Schritt getippt.
*/
export function schritt(s, dt, springen = false, zufall = Math.random) {
  if (s.vorbei) return s;
  const t = Math.min(0.05, Math.max(0, dt));

  let { y, vy, spruenge } = s.katze;
  if (springen && spruenge < HUEPFER.spruenge) {
    vy = HUEPFER.sprung * (spruenge === 0 ? 1 : 0.85);
    spruenge += 1;
  }
  vy -= HUEPFER.schwere * t;
  y += vy * t;
  if (y <= 0) { y = 0; vy = 0; spruenge = 0; }
  const katze = { y, vy, spruenge };

  const tempo = Math.min(HUEPFER.tempoMax, s.tempo + HUEPFER.beschleunigung * t);
  const weg = tempo * t;
  const hindernisse = s.hindernisse.map((o) => ({ ...o, x: o.x - weg })).filter((o) => o.x > -120);
  const verschoben = s.muenzen.map((m) => ({ ...m, x: m.x - weg })).filter((m) => m.x > -80);
  const muenzen = verschoben.filter((m) => !erwischt(katze, m));

  let neu = {
    ...s,
    zeit: s.zeit + t,
    strecke: s.strecke + weg,
    tempo,
    katze,
    hindernisse,
    muenzen,
    gesammelt: s.gesammelt + (verschoben.length - muenzen.length),
    naechstes: s.naechstes - weg,
  };
  if (neu.naechstes <= 0) neu = neueSachen(neu, zufall);
  if (neu.hindernisse.some((o) => stoesst(katze, o))) neu = { ...neu, vorbei: true };
  return neu;
}

export const meter = (s) => Math.floor(s.strecke / 100);
export const huepferLohn = (s) =>
  Math.min(HUEPFER.lohnMax, s.gesammelt + Math.floor(meter(s) / HUEPFER.meterJeMuenze));
