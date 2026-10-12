/*
  Leckerli-Drei (2.12.0): Match-3 mit Katzensachen.

  Zwei Nachbarfelder tauschen; ergibt das drei oder mehr Gleiche in einer
  Reihe oder Spalte, verschwinden sie, alles darüber rutscht nach, oben
  kommt Neues. Was dabei von selbst wieder passt, zählt als Kette und
  bringt mehr Punkte. Eine Viererreihe schenkt einen Zug, eine Fünferreihe
  zwei. Gibt es keinen möglichen Zug mehr, wird neu gemischt.

  Das Brett ist ein flaches Feld, Index = zeile * N + spalte. Jedes Feld
  hat eine feste id, damit die Darstellung es beim Rutschen verfolgen kann.
*/

export const DREIER = {
  n: 7,
  arten: ['fisch', 'keks', 'maus', 'wolle', 'feder'],
  zuege: 20,
  punkteJe: 10,
  lohnJe: 60,       // je 60 Punkte eine Münze
  lohnMax: 20,
};
const { n: N } = DREIER;

export const zeileVon = (i) => Math.floor(i / N);
export const spalteVon = (i) => i % N;
export const nachbarn = (a, b) =>
  (zeileVon(a) === zeileVon(b) && Math.abs(a - b) === 1) || (spalteVon(a) === spalteVon(b) && Math.abs(a - b) === N);

const wurf = (zufall) => DREIER.arten[Math.min(DREIER.arten.length - 1, Math.floor(zufall() * DREIER.arten.length))];

/* Alle Reihen aus mindestens drei Gleichen, waagrecht und senkrecht. */
export function reihen(brett) {
  const gefunden = [];
  const pruefen = (indizes) => {
    let lauf = [indizes[0]];
    for (let k = 1; k <= indizes.length; k += 1) {
      const i = indizes[k];
      if (k < indizes.length && brett[i] && brett[lauf[0]] && brett[i].art === brett[lauf[0]].art) {
        lauf.push(i);
      } else {
        if (lauf.length >= 3 && brett[lauf[0]]) gefunden.push(lauf);
        lauf = [i];
      }
    }
  };
  for (let z = 0; z < N; z += 1) pruefen(Array.from({ length: N }, (_, s) => z * N + s));
  for (let s = 0; s < N; s += 1) pruefen(Array.from({ length: N }, (_, z) => z * N + s));
  return gefunden;
}
export const treffer = (brett) => new Set(reihen(brett).flat());

export const tausch = (brett, a, b) => brett.map((f, i) => (i === a ? brett[b] : i === b ? brett[a] : f));
export const gueltig = (brett, a, b) => nachbarn(a, b) && treffer(tausch(brett, a, b)).size > 0;

export function hatZug(brett) {
  for (let i = 0; i < brett.length; i += 1) {
    if (spalteVon(i) < N - 1 && gueltig(brett, i, i + 1)) return true;
    if (zeileVon(i) < N - 1 && gueltig(brett, i, i + N)) return true;
  }
  return false;
}

/* Neues Brett ohne fertige Reihen, aber mit mindestens einem Zug. */
export function neuesBrett(zufall = Math.random, ab = 1) {
  for (let versuch = 0; versuch < 50; versuch += 1) {
    const brett = [];
    for (let i = 0; i < N * N; i += 1) {
      let art = wurf(zufall);
      for (let k = 0; k < 10; k += 1) {
        const links = spalteVon(i) >= 2 && brett[i - 1].art === art && brett[i - 2].art === art;
        const oben = zeileVon(i) >= 2 && brett[i - N].art === art && brett[i - 2 * N].art === art;
        if (!links && !oben) break;
        art = DREIER.arten[(DREIER.arten.indexOf(art) + 1) % DREIER.arten.length];
      }
      brett.push({ id: ab + versuch * N * N + i, art });
    }
    if (treffer(brett).size === 0 && hatZug(brett)) return brett;
  }
  throw new Error('Leckerli-Drei: kein spielbares Brett gefunden');
}

/* Leere Felder (null) auffüllen: alles rutscht nach unten, oben kommt Neues. */
export function nachrutschen(brett, zufall, naechsteId) {
  const neu = [...brett];
  let id = naechsteId;
  for (let s = 0; s < N; s += 1) {
    const spalte = [];
    for (let z = N - 1; z >= 0; z -= 1) if (brett[z * N + s]) spalte.push(brett[z * N + s]);
    for (let z = N - 1, k = 0; z >= 0; z -= 1, k += 1) {
      if (k < spalte.length) neu[z * N + s] = spalte[k];
      else { neu[z * N + s] = { id, art: wurf(zufall), neu: true }; id += 1; }
    }
  }
  return { brett: neu, naechsteId: id };
}

/*
  Einen Tausch ausführen und alle Ketten auflösen.
  Liefert die Schritte für die Darstellung: je Kette die weggeplatzten
  Felder und das Brett danach. null, wenn der Tausch nichts ergibt.
*/
export function zug(brett, a, b, zufall = Math.random, naechsteId = 10_000) {
  if (!gueltig(brett, a, b)) return null;
  let jetzt = tausch(brett, a, b);
  let id = naechsteId;
  let punkte = 0;
  let extra = 0;
  const schritte = [{ brett: jetzt, weg: [] }];
  for (let kette = 1; kette < 30; kette += 1) {
    const gefunden = reihen(jetzt);
    if (gefunden.length === 0) break;
    const weg = new Set(gefunden.flat());
    punkte += weg.size * DREIER.punkteJe * kette;
    extra += gefunden.reduce((e, r) => e + (r.length >= 5 ? 2 : r.length === 4 ? 1 : 0), 0);
    const geleert = jetzt.map((f, i) => (weg.has(i) ? null : f && { id: f.id, art: f.art }));
    const r = nachrutschen(geleert, zufall, id);
    id = r.naechsteId;
    jetzt = r.brett;
    schritte.push({ brett: jetzt, weg: [...weg], kette });
  }
  // Steckt das Brett fest, wird gemischt (neue Felder, gleiche Zahl)
  let gemischt = false;
  if (!hatZug(jetzt)) {
    jetzt = neuesBrett(zufall, id);
    id += 50 * N * N;
    gemischt = true;
    schritte.push({ brett: jetzt, weg: [], gemischt });
  }
  return { brett: jetzt, schritte, punkte, extra, gemischt, naechsteId: id };
}

export const dreierLohn = (punkte) => Math.min(DREIER.lohnMax, Math.floor(Math.max(0, punkte) / DREIER.lohnJe));
