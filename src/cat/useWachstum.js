import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { herzen, mehrFreundschaft, phase, tagesSchluessel, zaehleTag } from './wachstum.js';

const KEY_TAGE = 'cat_gepflegteTage';
const KEY_LETZTER = 'cat_letzterTag';
const KEY_FREUNDSCHAFT = 'cat_freundschaft';

const zahl = (key) => {
  try {
    const roh = localStorage.getItem(key);
    if (roh === null || roh.trim() === '') return 0;
    const v = Number(roh);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  } catch {
    return 0;
  }
};

const schreiben = (key, wert) => {
  try { localStorage.setItem(key, String(wert)); } catch { /* gesperrt */ }
};

/*
  Lebensphase und Freundschaft.

  Beides kennt nur eine Richtung: aufwärts. Ein vergessener Tag zählt nicht
  mit, kostet aber auch nichts – im Küchendienst ist Bestrafung fehl am Platz.
*/
export default function useWachstum(zustandKey, melde) {
  const [tage, setTage] = useState(() => zahl(KEY_TAGE));
  const [freundschaft, setFreundschaft] = useState(() => zahl(KEY_FREUNDSCHAFT));
  const letzterTagRef = useRef(null);
  const meldeRef = useRef(melde);
  meldeRef.current = melde;

  useEffect(() => {
    try { letzterTagRef.current = localStorage.getItem(KEY_LETZTER); } catch { /* gesperrt */ }
  }, []);

  useEffect(() => { schreiben(KEY_TAGE, tage); }, [tage]);
  useEffect(() => { schreiben(KEY_FREUNDSCHAFT, freundschaft); }, [freundschaft]);

  // Einmal je Kalendertag prüfen, ob der Tag zählt
  useEffect(() => {
    if (!zustandKey) return undefined;

    const pruefen = () => {
      const vorher = phase(tage);
      const r = zaehleTag(
        { gepflegteTage: tage, letzterTag: letzterTagRef.current, freundschaft },
        zustandKey,
      );
      if (!r.neuerTag) return;

      letzterTagRef.current = r.letzterTag;
      schreiben(KEY_LETZTER, r.letzterTag);
      setTage(r.gepflegteTage);
      setFreundschaft(r.freundschaft);

      const nachher = phase(r.gepflegteTage);
      if (nachher.key !== vorher.key) meldeRef.current?.(`Mails, ich bin jetzt ${nachher.name}! 🎉`);
    };

    pruefen();
    // Über Mitternacht hinweg weiterzählen, ohne dass jemand neu laden muss
    const id = setInterval(pruefen, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [zustandKey, tage, freundschaft]);

  const naeherKommen = useCallback((plus) => {
    setFreundschaft((f) => mehrFreundschaft(f, plus));
  }, []);

  return useMemo(() => ({
    tage,
    freundschaft,
    herzen: herzen(freundschaft),
    phase: phase(tage),
    naeherKommen,
    heute: tagesSchluessel(),
  }), [tage, freundschaft, naeherKommen]);
}
