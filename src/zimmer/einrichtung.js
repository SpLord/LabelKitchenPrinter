/*
  Was steht wo im Katzenzimmer?

  Stellplätze sind feste Punkte in der Szene (1024 × 768), gemeint ist jeweils
  die Mitte der Standfläche. Welches Möbel wohin kommt, folgt in Etappe 1 aus
  dem Besitz: Gekauftes steht auf seinem angestammten Platz. Selbst umstellen
  kommt mit dem Einrichten-Menü (Etappe 4).

  Napf und Wassernapf stehen immer da – Wasser ist laut Design immer
  kostenlos, und ohne Napf gäbe es nichts zu füttern.
*/

export const PLAETZE = {
  kratzbaum: { x: 300, y: 620, art: 'boden' },
  napf:      { x: 470, y: 602, art: 'boden' },
  wasser:    { x: 590, y: 606, art: 'boden' },
  hoehle:    { x: 860, y: 556, art: 'boden' },
  klo:       { x: 106, y: 668, art: 'boden' },
  vorne:     { x: 920, y: 662, art: 'boden' },
  regal:     { x: 495, y: 257, art: 'wand' },
};

/*
  Aus dem Besitz (Kennungen aus src/cat/laden.js) die Einrichtung ableiten.
  moebel: Menge der sichtbaren Möbel – die Verhaltenslogik liest daraus, was
  es gibt. frei: Stellplätze ohne Möbel, gestrichelt gezeichnet.
*/
export function einrichtung(besitz) {
  const hat = new Set(Array.isArray(besitz) ? besitz : []);
  const moebel = new Set(['napf']);
  moebel.add(hat.has('trinkbrunnen') ? 'trinkbrunnen' : 'wassernapf');
  if (hat.has('futterautomat')) moebel.add('futterautomat');
  if (hat.has('kratzbaum')) moebel.add('kratzbaum');
  if (hat.has('kuschelhoehle')) moebel.add('kuschelhoehle');
  if (hat.has('katzenklo')) moebel.add('katzenklo');

  const belegt = new Set(['napf', 'wasser']);
  if (moebel.has('kratzbaum')) belegt.add('kratzbaum');
  if (moebel.has('kuschelhoehle')) belegt.add('hoehle');
  if (moebel.has('katzenklo')) belegt.add('klo');
  const frei = Object.keys(PLAETZE).filter((p) => !belegt.has(p));

  return { moebel, frei };
}
