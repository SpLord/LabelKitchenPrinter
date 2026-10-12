import { useEffect, useRef, useState } from 'react';
import { gueltig, nachbarn, spalte, tausch, zeile, zug } from './brett.js';

const WARTEN = { tausch: 170, platzen: 260, fallen: 260 };
const pause = (ms) => new Promise((r) => { setTimeout(r, ms); });

/*
  Bedienung und Ablauf eines Bretts: antippen + Nachbarn antippen oder
  wischen, dann die Schritte des Zugs nacheinander zeigen (tauschen →
  platzen → nachrutschen → …). onZug bekommt die Summe des Zugs
  (punkte, gesammelt, kisten, pfuetzen, dosen), wenn alles in Ruhe ist.
  gesperrt: keine Eingaben (Zug-Ende, Startbild, Endbild).
*/
export default function useBrettSpiel(start, arten, onZug, gesperrt = false) {
  const [s, setS] = useState(start);
  const [gewaehlt, setGewaehlt] = useState(null);
  const [weg, setWeg] = useState([]);
  const [wackelt, setWackelt] = useState([]);
  const [effekte, setEffekte] = useState([]);
  const [meldung, setMeldung] = useState(null);
  const [beschaeftigt, setBeschaeftigt] = useState(false);
  const wischRef = useRef(null);
  const lebtRef = useRef(true);
  const onZugRef = useRef(onZug);
  onZugRef.current = onZug;
  useEffect(() => () => { lebtRef.current = false; }, []);
  useEffect(() => {
    if (!meldung) return undefined;
    const t = setTimeout(() => setMeldung(null), 1100);
    return () => clearTimeout(t);
  }, [meldung]);

  const versuchen = async (a, b) => {
    setGewaehlt(null);
    if (beschaeftigt || gesperrt || !nachbarn(s, a, b)) return;
    setBeschaeftigt(true);
    if (!gueltig(s, a, b)) {
      // Geht nicht: kurz tauschen, wackeln, zurück
      const vorher = s;
      setS(tausch(s, a, b));
      await pause(WARTEN.tausch);
      if (!lebtRef.current) return;
      setWackelt([a, b]);
      setS(vorher);
      await pause(WARTEN.platzen);
      if (!lebtRef.current) return;
      setWackelt([]);
      setBeschaeftigt(false);
      return;
    }
    const r = zug(s, a, b, arten);
    let vorher = r.schritte[0].s;
    setS(vorher);
    await pause(WARTEN.tausch);
    let effektNr = 0;
    for (const sch of r.schritte.slice(1)) {
      if (!lebtRef.current) return;
      if (sch.platzt.length || sch.effekte.length) {
        setWeg(sch.platzt);
        setEffekte(sch.effekte.map((e) => { effektNr += 1; return { ...e, key: effektNr, z: zeile(vorher, e.i), sp: spalte(vorher, e.i) }; }));
        if (sch.kette > 1) setMeldung(`Kette ×${sch.kette}!`);
        if (sch.dosen) setMeldung(sch.dosen === 1 ? 'Dose unten!' : `${sch.dosen} Dosen unten!`);
        await pause(WARTEN.platzen);
      }
      if (!lebtRef.current) return;
      if (sch.gemischt) setMeldung('Neu gemischt');
      setWeg([]);
      setEffekte([]);
      setS(sch.s);
      vorher = sch.s;
      await pause(WARTEN.fallen);
    }
    if (!lebtRef.current) return;
    setBeschaeftigt(false);
    onZugRef.current?.(r, r.s);
  };

  const tippen = (i) => {
    if (gesperrt || beschaeftigt) return;
    if (gewaehlt === null) { setGewaehlt(i); return; }
    if (gewaehlt === i) { setGewaehlt(null); return; }
    if (nachbarn(s, gewaehlt, i)) { versuchen(gewaehlt, i); return; }
    setGewaehlt(i);
  };

  // Wischen: die Richtung der Bewegung bestimmt den Nachbarn
  const runter = (i, e) => { wischRef.current = { i, x: e.clientX, y: e.clientY }; };
  const hoch = (i, e) => {
    const w = wischRef.current;
    wischRef.current = null;
    if (!w) return;
    const dx = e.clientX - w.x;
    const dy = e.clientY - w.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) { tippen(i); return; }
    const z = zeile(s, w.i);
    const sp = spalte(s, w.i);
    const ziel = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? (sp < s.n - 1 ? w.i + 1 : null) : (sp > 0 ? w.i - 1 : null))
      : (dy > 0 ? (z < s.n - 1 ? w.i + s.n : null) : (z > 0 ? w.i - s.n : null));
    if (ziel !== null) versuchen(w.i, ziel);
  };

  return {
    s, setS, gewaehlt, weg, wackelt, effekte, meldung, setMeldung, beschaeftigt,
    tippen, runter, hoch,
  };
}
