import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { datumFuerDruck, gueltigeWahl, schichtSchluessel, tagSchluessel } from './schicht.js';

const datumAusSchluessel = (s) => {
  const [j, m, t] = s.split('-').map(Number);
  return new Date(j, m - 1, t, 12);
};

const mittags = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

/*
  Etikettendatum für die Oberfläche (Regeln in schicht.js).

  - fuerDruck() bestimmt das Datum im Moment des Drucks frisch aus der Uhr.
    Das gedruckte Datum ist damit immer richtig, auch wenn kein Timer lief.
  - Timer und Aufwachen des Tablets halten nur die ANZEIGE aktuell.
  - Eine eigene Wahl gilt nur in ihrer Schicht und verfällt um 5 Uhr.
*/
export default function useSchichtDatum() {
  const [schicht, setSchicht] = useState(() => schichtSchluessel());
  const [wahl, setWahl] = useState(null);   // { datum, schicht } | null
  /*
    Ref zusätzlich zum State: wer direkt nach waehlen() druckt oder die
    Vorschau neu rendert, liest sonst noch den alten Wert aus dem Closure –
    genau so zeigte die Vorschau nach einem Datumswechsel das alte Datum.
  */
  const wahlRef = useRef(null);

  useEffect(() => {
    const pruefen = () => {
      const jetzt = new Date();
      setSchicht(schichtSchluessel(jetzt));
      // Verfallene Wahl auch aus dem Zustand nehmen, nicht nur ignorieren
      const noch = gueltigeWahl(wahlRef.current, jetzt);
      if (noch !== wahlRef.current) {
        wahlRef.current = noch;
        setWahl(noch);
      }
    };
    // Jede Minute – und sofort, wenn das Tablet aufwacht (dann standen die Timer)
    const id = setInterval(pruefen, 60_000);
    const sichtbar = () => { if (document.visibilityState === 'visible') pruefen(); };
    document.addEventListener('visibilitychange', sichtbar);
    window.addEventListener('focus', pruefen);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', sichtbar);
      window.removeEventListener('focus', pruefen);
    };
  }, []);

  const waehlen = useCallback((d) => {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return;
    const jetzt = schichtSchluessel();
    // Wer den heutigen Schichttag wählt, will zurück zur Automatik
    const neu = tagSchluessel(d) === jetzt ? null : { datum: mittags(d), schicht: jetzt };
    wahlRef.current = neu;
    setWahl(neu);
  }, []);

  const zuruecksetzen = useCallback(() => {
    wahlRef.current = null;
    setWahl(null);
  }, []);

  const fuerDruck = useCallback(() => datumFuerDruck(wahlRef.current, new Date()), []);

  return useMemo(() => {
    const gueltig = wahl && wahl.schicht === schicht ? wahl : null;
    const datum = gueltig ? gueltig.datum : datumAusSchluessel(schicht);
    return { datum, abweichend: Boolean(gueltig), waehlen, zuruecksetzen, fuerDruck };
  }, [wahl, schicht, waehlen, zuruecksetzen, fuerDruck]);
}
