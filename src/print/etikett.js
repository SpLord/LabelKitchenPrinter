/*
  Beschriftung eines Etiketts.

  Die Vorlage hat genau zwei Felder, Name und Datum, und vertikal ist kein
  Platz für ein drittes: der Name belegt 0,72 von 1,13 Zoll, das Datum weitere
  0,30 – es bleiben 0,046 Zoll. Das Verwendbar-bis wandert deshalb mit ins
  Datumsfeld. Beide Felder stehen auf FitMode AlwaysFit, der Text schrumpft
  also in seine Box statt überzulaufen.

  Reine Funktionen, damit die Regeln ohne Drucker prüfbar sind.
*/

export const MAX_TAGE = 365;

const TAG = 24 * 60 * 60 * 1000;

/* Tagesangabe säubern: leer oder unbrauchbar heisst "kein Verwendbar-bis". */
export const putzeTage = (wert) => {
  if (wert === null || wert === undefined || wert === '') return null;
  const n = Math.round(Number(wert));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, MAX_TAGE);
};

/* Verbrauchsdatum aus Herstelldatum plus Haltbarkeit. */
export const verwendbarBis = (herstellung, tage) => {
  const n = putzeTage(tage);
  if (n === null || !(herstellung instanceof Date) || Number.isNaN(herstellung.getTime())) return null;
  return new Date(herstellung.getTime() + n * TAG);
};

const kurz = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
const lang = (d) => d.toLocaleDateString('de-DE');

/*
  Text fürs Datumsfeld.
  Ohne Haltbarkeit bleibt es beim vollen Herstelldatum wie bisher – wer nichts
  einträgt, bekommt genau das gewohnte Etikett. Mit Haltbarkeit stehen beide
  Daten kurz nebeneinander, damit der Text nicht zu stark schrumpft.
*/
export const datumsText = (herstellung, tage) => {
  const bis = verwendbarBis(herstellung, tage);
  if (!bis) return lang(herstellung);
  return `${kurz(herstellung)} → ${kurz(bis)}`;
};
