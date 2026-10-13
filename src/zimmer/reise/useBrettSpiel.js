import { useCallback, useEffect, useRef, useState } from 'react';
import { gueltig, hinweis, nachbarn, pfote, spalte, tausch, zeile, zug } from './brett.js';

const WARTEN = { tausch: 150, platzen: 260, fallen: 240 };
const HINWEIS_NACH = 5_000;
const ZIEH_SCHWELLE = 0.38;   // so weit (Anteil eines Felds) ziehen, dann wird getauscht
const pause = (ms) => new Promise((r) => { setTimeout(r, ms); });

/* Lob wie im Original – je länger die Kette, desto grösser */
const LOB = ['', '', 'Lecker!', 'Köstlich!', 'Mjam-mjam!', 'Göttlich!'];
export const lobFuer = (kette) => LOB[Math.min(LOB.length - 1, kette)] || null;

/*
  Bedienung und Ablauf eines Bretts (Leckerli-Drei und Leckerli-Reise).

  Ziehen: das Feld folgt dem Finger (eine Achse, höchstens ein Feld weit),
  der Nachbar weicht entgegen; ab ZIEH_SCHWELLE wird getauscht, ohne
  loszulassen. Kurzes Antippen wählt aus, Antippen des Nachbarn tauscht.
  Nach 5 s ohne Eingabe wackeln zwei Felder als Hinweis.
  Pfote: einmal je Spiel ein Feld wegklopfen, ohne Zug.

  onZug(r, sNeu, { ohneZug }) bekommt die Summe, wenn alles in Ruhe ist.
  gesperrt: keine Eingaben (Startbild, Endbild, Rausch).
*/
export default function useBrettSpiel(start, arten, onZug, gesperrt = false, pfoten = 1) {
  const [s, setS] = useState(start);
  const sRef = useRef(s);
  sRef.current = s;
  const [gewaehlt, setGewaehlt] = useState(null);
  const [weg, setWeg] = useState([]);
  const [wackelt, setWackelt] = useState([]);
  const [effekte, setEffekte] = useState([]);
  const [pops, setPops] = useState([]);
  const [meldung, setMeldung] = useState(null);
  const [beschaeftigt, setBeschaeftigt] = useState(false);
  const [ziehen, setZiehen] = useState(null);       // { i, nach, dx, dy } in Pixeln
  const [tipp, setTipp] = useState(null);           // Hinweis-Paar
  const [pfotenUebrig, setPfotenUebrig] = useState(pfoten);
  const [pfoteAn, setPfoteAn] = useState(false);
  const wischRef = useRef(null);
  const lebtRef = useRef(true);
  const nrRef = useRef(0);
  const onZugRef = useRef(onZug);
  onZugRef.current = onZug;
  const [ruhe, setRuhe] = useState(0);              // jede Eingabe setzt den Hinweis-Zähler neu
  useEffect(() => () => { lebtRef.current = false; }, []);
  useEffect(() => {
    if (!meldung) return undefined;
    const t = setTimeout(() => setMeldung(null), 1100);
    return () => clearTimeout(t);
  }, [meldung]);

  // Hinweis nach ein paar Sekunden ohne Zug
  useEffect(() => {
    setTipp(null);
    if (gesperrt || beschaeftigt) return undefined;
    const t = setTimeout(() => setTipp(hinweis(sRef.current)), HINWEIS_NACH);
    return () => clearTimeout(t);
  }, [ruhe, gesperrt, beschaeftigt]);

  /* Die Schritte eines Ergebnisses nacheinander zeigen (Zug, Pfote, Rausch). */
  const abspielen = useCallback(async (r) => {
    let vorher = r.schritte[0]?.s ?? sRef.current;
    if (r.schritte.length) { setS(vorher); await pause(WARTEN.tausch); }
    for (const sch of r.schritte.slice(1)) {
      if (!lebtRef.current) return false;
      if (sch.platzt.length || sch.effekte.length) {
        setWeg(sch.platzt);
        setEffekte(sch.effekte.map((e) => { nrRef.current += 1; return { ...e, key: nrRef.current, z: zeile(vorher, e.i), sp: spalte(vorher, e.i) }; }));
        if (sch.punkte > 0 && sch.mitte) {
          nrRef.current += 1;
          const pop = { key: nrRef.current, ...sch.mitte, punkte: sch.punkte };
          setPops((p) => [...p.slice(-5), pop]);
          setTimeout(() => setPops((p) => p.filter((x) => x.key !== pop.key)), 900);
        }
        const lob = lobFuer(sch.kette ?? 0);
        if (lob) setMeldung(lob);
        if (sch.dosen) setMeldung(sch.dosen === 1 ? 'Dose unten!' : `${sch.dosen} Dosen unten!`);
        await pause(WARTEN.platzen);
      }
      if (!lebtRef.current) return false;
      if (sch.gemischt) setMeldung('Neu gemischt');
      setWeg([]);
      setEffekte([]);
      setS(sch.s);
      vorher = sch.s;
      await pause(WARTEN.fallen);
    }
    return lebtRef.current;
  }, []);

  const versuchen = async (a, b) => {
    setGewaehlt(null);
    setZiehen(null);
    setRuhe((n) => n + 1);
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
    if (r.schritte[1]?.effekte.some((e) => e.art === 'regen') || (s.felder[a].spezial && s.felder[b].spezial)) setMeldung('Wow!');
    if (!(await abspielen(r))) return;
    setBeschaeftigt(false);
    onZugRef.current?.(r, r.s, { ohneZug: false });
  };

  const klopfen = async (i) => {
    const r = pfote(s, i, arten);
    setPfoteAn(false);
    if (!r) { setMeldung('Die Dose hält das aus'); return; }
    setPfotenUebrig((n) => n - 1);
    setBeschaeftigt(true);
    if (!(await abspielen(r))) return;
    setBeschaeftigt(false);
    onZugRef.current?.(r, r.s, { ohneZug: true });
  };

  const tippen = (i) => {
    setRuhe((n) => n + 1);
    if (gesperrt || beschaeftigt) return;
    if (pfoteAn) { klopfen(i); return; }
    if (gewaehlt === null) { setGewaehlt(i); return; }
    if (gewaehlt === i) { setGewaehlt(null); return; }
    if (nachbarn(s, gewaehlt, i)) { versuchen(gewaehlt, i); return; }
    setGewaehlt(i);
  };

  // ── Ziehen ───────────────────────────────────────────────────────────────
  const runter = (i, e) => {
    setRuhe((n) => n + 1);
    if (gesperrt || beschaeftigt) return;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* ältere Browser */ }
    wischRef.current = { i, x: e.clientX, y: e.clientY, feld: e.currentTarget.getBoundingClientRect().width || 60 };
  };
  const bewegen = (i, e) => {
    const w = wischRef.current;
    if (!w || w.i !== i || pfoteAn) return;
    const dx = e.clientX - w.x;
    const dy = e.clientY - w.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
    const waagrecht = Math.abs(dx) >= Math.abs(dy);
    const d = waagrecht ? dx : dy;
    const z = zeile(s, i); const sp = spalte(s, i);
    const nach = waagrecht
      ? (d > 0 ? (sp < s.n - 1 ? i + 1 : null) : (sp > 0 ? i - 1 : null))
      : (d > 0 ? (z < s.n - 1 ? i + s.n : null) : (z > 0 ? i - s.n : null));
    const grenze = w.feld;
    const weit = Math.max(-grenze, Math.min(grenze, d));
    if (nach !== null && Math.abs(weit) >= grenze * ZIEH_SCHWELLE && s.felder[nach]?.art !== 'kiste' && s.felder[i]?.art !== 'kiste') {
      wischRef.current = null;
      versuchen(i, nach);
      return;
    }
    // Am Rand oder an einer Kiste: nur ein kleines Federn
    const gedaempft = nach === null ? weit * 0.15 : weit;
    setZiehen({ i, nach, dx: waagrecht ? gedaempft : 0, dy: waagrecht ? 0 : gedaempft });
  };
  const hoch = (i, e) => {
    const w = wischRef.current;
    wischRef.current = null;
    setZiehen(null);
    if (!w || w.i !== i) return;
    if (Math.max(Math.abs(e.clientX - w.x), Math.abs(e.clientY - w.y)) < 10) tippen(i);
  };
  const abbrechen = () => { wischRef.current = null; setZiehen(null); };

  return {
    s, setS, gewaehlt, weg, wackelt, effekte, pops, meldung, setMeldung, beschaeftigt, setBeschaeftigt,
    ziehen, tipp, pfotenUebrig, pfoteAn, setPfoteAn: (an) => { if (pfotenUebrig > 0 && !beschaeftigt) setPfoteAn(an); },
    tippen, runter, bewegen, hoch, abbrechen, abspielen,
  };
}
