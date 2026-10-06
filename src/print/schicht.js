/*
  Welches Datum gehört aufs Etikett?

  Der Schichttag: ab 5 Uhr zählt der Kalendertag, davor gehört die Nacht noch
  zur Schicht des Vortags.

  Bis Oktober 2026 wurde das einmal beim Laden der Seite berechnet. Ein
  Tablet, das über Nacht anblieb, druckte am Morgen weiter das Datum des
  Vortags – auf Lebensmitteletiketten. Deshalb wird das Druckdatum jetzt bei
  JEDEM Druck frisch aus der Uhr bestimmt. Die Richtigkeit hängt an keinem
  Timer; ein schlafendes Tablet drosselt Timer, genau dann käme der Fehler
  sonst zurück.

  Ein von Hand gewähltes Datum gilt nur in der Schicht, in der es gewählt
  wurde. Ein bewusst zurückdatiertes Etikett darf nicht unbemerkt bis in den
  nächsten Tag stehen bleiben.

  Reine Funktionen, damit das ohne Browser und ohne Warten prüfbar ist.
*/

export const SCHICHTWECHSEL_STUNDE = 5;

const zweistellig = (n) => String(n).padStart(2, '0');

/* Schichttag als Datum, mittags – so kann keine Zeitumstellung den Tag kippen. */
export const schichtDatum = (jetzt = new Date()) => {
  const d = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate(), 12);
  if (jetzt.getHours() < SCHICHTWECHSEL_STUNDE) d.setDate(d.getDate() - 1);
  return d;
};

/* Schichttag als Schlüssel JJJJ-MM-TT, zum Vergleichen ohne Uhrzeit. */
export const schichtSchluessel = (jetzt = new Date()) => {
  const d = schichtDatum(jetzt);
  return `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}`;
};

/* Kalendertag eines beliebigen Datums als Schlüssel (ohne Schichtverschiebung). */
export const tagSchluessel = (d) =>
  `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}`;

/* Eine eigene Wahl { datum, schicht } – nur gültig in ihrer Schicht. */
export const gueltigeWahl = (wahl, jetzt = new Date()) => {
  if (!wahl || !(wahl.datum instanceof Date) || Number.isNaN(wahl.datum.getTime())) return null;
  return wahl.schicht === schichtSchluessel(jetzt) ? wahl : null;
};

/* Das Datum, das JETZT aufs Etikett gehört. */
export const datumFuerDruck = (wahl, jetzt = new Date()) =>
  gueltigeWahl(wahl, jetzt)?.datum ?? schichtDatum(jetzt);
