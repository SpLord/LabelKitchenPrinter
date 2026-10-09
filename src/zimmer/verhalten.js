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
export const WASSER_SCHLUCK = 25;   // so viel leert ein Gang die Wasserschale (2.5.0)
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
  // 2.4.0
  regal:     { x: 495, y: 250, richtung: -1 },
  gras:      { x: 872, y: 668, richtung: 1 },
  // 2.7.0
  fensterbank: { x: 176, y: 292, richtung: -1 },
  sonnenfleck: { x: 330, y: 640, richtung: -1 },
  // 2.9.0
  karton:    { x: 190, y: 546, richtung: -1 },
  aquarium:  { x: 700, y: 610, richtung: 1 },
  teppich:   { x: 660, y: 644, richtung: -1 },
};
export const REGAL_LAUNE = 2;
export const KNABBER_LAUNE = 2;
export const BALL_LAUNE = 3;

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
  if (durst < SCHWELLE) {
    // Leere Schale: sie setzt sich davor und wartet – der Hinweis zum Auffüllen
    const wasserDa = moebel.has('trinkbrunnen') || (lage.wasser ?? 100) > 0;
    return wasserDa
      ? { art: 'trinken', ort: ORTE.wasser, dauer: 6_000, blase: 'durst' }
      : { art: 'wasserLeer', ort: ORTE.wasser, dauer: 12_000, blase: 'durst' };
  }
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
    // 2.7.0: mehr verschiedene Sachen, jede mit eigener Animation
    { art: 'schwanzjagd', gewicht: 1, dauer: 2_800 },
    { art: 'rennen', gewicht: 1, dauer: 600, schnell: true },
    { art: 'treteln', gewicht: 2, dauer: 6_000 },
    { art: 'fliege', gewicht: 1, dauer: 5_000 },
    { art: 'fensterbank', gewicht: 2, ort: ORTE.fensterbank, dauer: 12_000 },
    lage.sonne && { art: 'sonnen', gewicht: 3, ort: ORTE.sonnenfleck, dauer: 20_000 },
    // 2.9.0: in den Karton, Fische gucken, auf dem Teppich räkeln
    moebel.has('karton') && { art: 'karton', gewicht: 3, ort: ORTE.karton, dauer: 12_000 },
    moebel.has('aquarium') && { art: 'fische', gewicht: 3, ort: ORTE.aquarium, dauer: 10_000 },
    moebel.has('teppich') && { art: 'raekeln', gewicht: 2, ort: ORTE.teppich, dauer: 5_000 },
    moebel.has('kratzbaum') && { art: 'kratzen', gewicht: 2, ort: ORTE.kratzbaum, dauer: 6_000 },
    // 2.4.0: hinauf aufs Regal, am Katzengras knabbern, den Ball anstupsen
    moebel.has('wandregal') && { art: 'regal', gewicht: 2, ort: ORTE.regal, dauer: 10_000 },
    moebel.has('katzengras') && { art: 'knabbern', gewicht: 2, ort: ORTE.gras, dauer: 4_000 },
    moebel.has('ball') && lage.ball && {
      art: 'ball', gewicht: 3, dauer: 1_800,
      ort: { x: lage.ball.x + (lage.ball.x > 512 ? -46 : 46), y: lage.ball.y, richtung: lage.ball.x > 512 ? 1 : -1 },
    },
  ].filter(Boolean);
  const wahl = gewichtet(frei, zufall);
  // Bummeln und Rennanfall führen an einen Zufallsort; rennen quer durchs Zimmer
  const ort = wahl.ort ?? (wahl.art === 'bummeln' || wahl.art === 'rennen' ? bummelOrt(zufall) : null);
  return { art: wahl.art, ort, dauer: wahl.dauer, blase: null, ...(wahl.schnell ? { schnell: true } : {}) };
}

/*
  Was eine abgeschlossene Tätigkeit bewirkt – als Änderungen, die der Aufrufer
  anwendet. Gibt nur zurück, was sich ändert.
*/
export function wirkung(art, lage) {
  const { hunger = 100, napf = 0 } = lage;
  switch (art) {
    case 'trinken': return lage.moebel?.has('trinkbrunnen') ? { durst: SCHLUCK } : { durst: SCHLUCK, wasser: -WASSER_SCHLUCK };
    case 'fressen': {
      const gefressen = Math.max(0, Math.min(napf, PORTION, 100 - hunger));
      return gefressen > 0 ? { hunger: gefressen, napf: -gefressen } : {};
    }
    case 'kratzen': return { laune: KRATZ_LAUNE };
    // Sonnenbad (viertes Herz): dreimal so viel Laune am Fenster
    case 'fenster': return { laune: lage.sonnenbad ? FENSTER_LAUNE * 3 : FENSTER_LAUNE };
    case 'klo':
    case 'haeufchen': return { gang: true };
    case 'regal': return { laune: REGAL_LAUNE };
    case 'knabbern': return { laune: KNABBER_LAUNE };
    case 'ball': return { laune: BALL_LAUNE, ball: true };
    case 'schwanzjagd': case 'rennen': case 'fliege': return { laune: 2 };
    case 'treteln': case 'fensterbank': return { laune: 1 };
    case 'sonnen': return { laune: 3 };
    case 'karton': case 'fische': return { laune: 2 };
    case 'raekeln': return { laune: 2 };
    default: return {};
  }
}

/* Wie lange der Weg dauert – gleichmässiges Tempo, nie unter einer Sekunde. */
export const TEMPO = 150;   // Szenenpunkte je Sekunde
export const wegDauer = (von, nach) => {
  const strecke = Math.hypot((nach.x ?? 0) - (von.x ?? 0), (nach.y ?? 0) - (von.y ?? 0));
  return Math.max(1000, Math.round((strecke / TEMPO) * 1000));
};
