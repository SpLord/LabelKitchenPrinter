/*
  Auswahl und Stückzahl für den Etikettendruck.
  Reine Funktionen, damit die Regeln ohne Drucker prüfbar bleiben.
*/

export const MIN_ANZAHL = 1;
export const MAX_ANZAHL = 20;
export const KEY_DRUCKER = 'etikett_drucker';

/* Namen aus der Antwort des DYMO-Frameworks ziehen, Unbrauchbares verwerfen. */
export const druckerNamen = (rohe) =>
  Array.isArray(rohe)
    ? rohe.map((p) => (typeof p === 'string' ? p : p?.name)).filter((n) => typeof n === 'string' && n.trim())
    : [];

/*
  Welcher Drucker soll es sein?
  Die gemerkte Wahl gewinnt, solange sie noch angeschlossen ist – sonst der
  erste gefundene. Vorher wurde immer blind printers[0] genommen; hängen zwei
  Geräte im Netz, druckte es womöglich im falschen Raum.
*/
export const waehleDrucker = (namen, gemerkt) => {
  if (!namen.length) return null;
  return gemerkt && namen.includes(gemerkt) ? gemerkt : namen[0];
};

export const begrenzeAnzahl = (wert) => {
  const n = Math.round(Number(wert));
  if (!Number.isFinite(n)) return MIN_ANZAHL;
  return Math.max(MIN_ANZAHL, Math.min(MAX_ANZAHL, n));
};

/*
  Druckparameter für mehrere Exemplare.

  Das DYMO-Framework kennt createLabelWriterPrintParamsXml; fehlt die Funktion
  (ältere Fassung), liefern wir null und der Aufrufer druckt stattdessen
  mehrfach einzeln.
*/
export const druckParameter = (framework, anzahl) => {
  const n = begrenzeAnzahl(anzahl);
  if (n <= 1) return { xml: null, wiederholungen: 1 };
  try {
    if (typeof framework?.createLabelWriterPrintParamsXml === 'function') {
      return { xml: framework.createLabelWriterPrintParamsXml({ copies: n }), wiederholungen: 1 };
    }
  } catch { /* Fassung kennt die Funktion nicht – unten einzeln drucken */ }
  return { xml: null, wiederholungen: n };
};
