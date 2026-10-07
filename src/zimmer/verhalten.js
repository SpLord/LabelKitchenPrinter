/*
  Was tut die Katze als Nächstes?

  Reine Entscheidung ohne Browser, ohne Zeit, ohne Zufall von aussen – der
  Zufall wird hineingereicht, damit die Tests ihn festnageln können. Wer die
  Katze bewegt und wann, regelt useKatzeImZimmer.js.

  Rangfolge (Design 2026-10-06): krank → Nacht → Durst → Hunger → muss mal →
  freie Zeit.
  Ein Bedürfnis gilt ab SCHWELLE als dringend; darüber hat sie frei.

  Koordinaten: Szene 1024 × 768, gemeint ist immer der Punkt zwischen den
  Pfoten der Katze. richtung −1 = schaut nach links (so ist sie gezeichnet).
*/

export const SCHWELLE = 40;
export const PORTION = 35;          // so viel frisst sie höchstens auf einmal
export const SCHLUCK = 30;          // so viel Durst stillt ein Gang zum Wasser
export const KRATZ_LAUNE = 3;
export const FENSTER_LAUNE = 1;

/* Wo die Katze steht, um etwas zu benutzen – passend zu stellplaetze.js. */
export const ORTE = {
  napf:      { x: 548, y: 640, richtung: -1 },
  wasser:    { x: 668, y: 646, richtung: -1 },
  kratzbaum: { x: 384, y: 644, richtung: -1 },
  hoehle:    { x: 862, y: 600, richtung: -1 },
  fenster:   { x: 214, y: 300, richtung: 1 },
  liegen:    { x: 640, y: 660, richtung: -1 },
  klo:       { x: 118, y: 662, richtung: 1 },
};

const BODEN = { links: 180, rechts: 960, oben: 568, unten: 680 };

/* Ein beliebiger Punkt auf dem Boden – zum Herumbummeln. */
export const bummelOrt = (zufall) => ({
  x: Math.round(BODEN.links + zufall() * (BODEN.rechts - BODEN.links)),
  y: Math.round(BODEN.oben + zufall() * (BODEN.unten - BODEN.oben)),
  richtung: zufall() < 0.5 ? -1 : 1,
});

const gewichtet = (liste, zufall) => {
  const summe = liste.reduce((s, e) => s + e.gewicht, 0);
  let wurf = zufall() * summe;
  for (const e of liste) {
    wurf -= e.gewicht;
    if (wurf < 0) return e;
  }
  return liste[liste.length - 1];
};

/*
  lage: { hunger, durst, krank, nacht, napf, mussMal, kloPlatz, moebel: Set<string> }
  mussMal: ein Gang ist fällig (klo.js); kloPlatz: es steht ein Klo und es
  ist nicht voll.
  Liefert { art, ort, dauer, blase } – blase ist das, was sie in der
  Gedankenblase zeigt (oder null).
*/
export function naechsteTaetigkeit(lage, zufall = Math.random) {
  const { hunger = 100, durst = 100, krank = false, nacht = false, napf = 0 } = lage;
  const moebel = lage.moebel ?? new Set();

  if (krank) return { art: 'liegen', ort: ORTE.liegen, dauer: 20_000, blase: 'krank' };
  if (nacht) {
    return { art: 'schlafen', ort: moebel.has('kuschelhoehle') ? ORTE.hoehle : ORTE.liegen, dauer: 60_000, blase: null };
  }
  if (durst < SCHWELLE) return { art: 'trinken', ort: ORTE.wasser, dauer: 6_000, blase: 'durst' };
  if (hunger < SCHWELLE) {
    // Leerer Napf: sie setzt sich davor und wartet – das ist der Hinweis
    return napf > 0
      ? { art: 'fressen', ort: ORTE.napf, dauer: 7_000, blase: 'hunger' }
      : { art: 'betteln', ort: ORTE.napf, dauer: 15_000, blase: 'hunger' };
  }
  if (lage.mussMal) {
    return lage.kloPlatz
      ? { art: 'klo', ort: ORTE.klo, dauer: 4_000, blase: null }
      : { art: 'haeufchen', ort: bummelOrt(zufall), dauer: 2_500, blase: null };
  }

  const frei = [
    { art: 'fenster', gewicht: 3, ort: ORTE.fenster, dauer: 12_000 },
    { art: 'bummeln', gewicht: 4, dauer: 3_000 },
    { art: 'sitzen', gewicht: 3, dauer: 9_000 },
    // Kleine Dinge am Platz (2.3.0): machen sie lebendig, ohne dass sie läuft
    { art: 'putzen', gewicht: 2, dauer: 5_000 },
    { art: 'strecken', gewicht: 1, dauer: 2_600 },
    { art: 'gaehnen', gewicht: 1, dauer: 2_200 },
    moebel.has('kratzbaum') && { art: 'kratzen', gewicht: 2, ort: ORTE.kratzbaum, dauer: 6_000 },
  ].filter(Boolean);
  const wahl = gewichtet(frei, zufall);
  const ort = wahl.ort ?? (wahl.art === 'bummeln' ? bummelOrt(zufall) : null);
  return { art: wahl.art, ort, dauer: wahl.dauer, blase: null };
}

/*
  Was eine abgeschlossene Tätigkeit bewirkt – als Änderungen, die der Aufrufer
  anwendet. Gibt nur zurück, was sich ändert.
*/
export function wirkung(art, lage) {
  const { hunger = 100, napf = 0 } = lage;
  switch (art) {
    case 'trinken': return { durst: SCHLUCK };
    case 'fressen': {
      const gefressen = Math.max(0, Math.min(napf, PORTION, 100 - hunger));
      return gefressen > 0 ? { hunger: gefressen, napf: -gefressen } : {};
    }
    case 'kratzen': return { laune: KRATZ_LAUNE };
    // Sonnenbad (viertes Herz): dreimal so viel Laune am Fenster
    case 'fenster': return { laune: lage.sonnenbad ? FENSTER_LAUNE * 3 : FENSTER_LAUNE };
    case 'klo':
    case 'haeufchen': return { gang: true };
    default: return {};
  }
}

/* Wie lange der Weg dauert – gleichmässiges Tempo, nie unter einer Sekunde. */
export const TEMPO = 150;   // Szenenpunkte je Sekunde
export const wegDauer = (von, nach) => {
  const strecke = Math.hypot((nach.x ?? 0) - (von.x ?? 0), (nach.y ?? 0) - (von.y ?? 0));
  return Math.max(1000, Math.round((strecke / TEMPO) * 1000));
};
