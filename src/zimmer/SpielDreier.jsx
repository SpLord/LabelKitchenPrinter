import { useEffect, useRef, useState } from 'react';
import { DREIER, gueltig, nachbarn, neuesBrett, spalteVon, tausch, zeileVon, zug } from './dreier.js';

const N = DREIER.n;
const K = { stroke: '#2f2a26', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };

/* Die fünf Leckerli, je mit eigener Farbe, damit man sie auch aus dem Augenwinkel unterscheidet. */
const BILD = {
  fisch: <g {...K}><path d="M-14 0 C-6 -12 12 -12 16 0 C12 12 -6 12 -14 0 Z" fill="#fb923c" /><path d="M-14 0 l-8 -8 v16 Z" fill="#fb923c" /><circle cx="8" cy="-2" r="2" fill="#2f2a26" stroke="none" /></g>,
  keks: <g {...K}><circle r="15" fill="#d6a15d" /><g fill="#7c4a1e" stroke="none"><circle cx="-6" cy="-5" r="2.6" /><circle cx="5" cy="-7" r="2.2" /><circle cx="6" cy="5" r="2.6" /><circle cx="-4" cy="7" r="2.2" /></g></g>,
  maus: <g {...K}><circle cx="-10" cy="-9" r="7" fill="#d1d5db" /><circle cx="10" cy="-9" r="7" fill="#d1d5db" /><ellipse cx="0" cy="3" rx="13" ry="11" fill="#d1d5db" /><circle cx="-4" cy="1" r="1.8" fill="#2f2a26" stroke="none" /><circle cx="4" cy="1" r="1.8" fill="#2f2a26" stroke="none" /><circle cx="0" cy="7" r="2.4" fill="#f472b6" stroke="none" /></g>,
  wolle: <g {...K}><circle r="14" fill="#f472b6" /><path d="M-11 -5 q11 7 22 0 M-12 4 q12 7 24 0" fill="none" stroke="#9d174d" strokeWidth="2" /></g>,
  feder: <g {...K}><path d="M12 -15 C-10 -10 -14 6 -12 14 C0 12 14 0 12 -15 Z" fill="#60a5fa" /><path d="M-12 14 L8 -8" fill="none" strokeWidth="2" /></g>,
};

const WARTEN = { tausch: 170, platzen: 230, fallen: 260 };
const pause = (ms) => new Promise((r) => { setTimeout(r, ms); });

/*
  Leckerli-Drei (2.12.0): Antippen und Nachbarn antippen – oder wischen.
  Die Felder werden per CSS-Übergang verschoben (key = id), so rutschen sie
  sichtbar nach; neue fallen von oben herein, geplatzte schrumpfen weg.
*/
export default function SpielDreier({ onEnde }) {
  const [brett, setBrett] = useState(() => neuesBrett());
  const [gewaehlt, setGewaehlt] = useState(null);
  const [weg, setWeg] = useState([]);
  const [wackelt, setWackelt] = useState([]);
  const [zuege, setZuege] = useState(DREIER.zuege);
  const [punkte, setPunkte] = useState(0);
  const [meldung, setMeldung] = useState(null);
  const [beschaeftigt, setBeschaeftigt] = useState(false);
  const idRef = useRef(5_000);
  const wischRef = useRef(null);
  const lebtRef = useRef(true);
  useEffect(() => () => { lebtRef.current = false; }, []);

  useEffect(() => {
    if (zuege > 0 || beschaeftigt) return undefined;
    const t = setTimeout(() => onEnde(punkte), 900);
    return () => clearTimeout(t);
  }, [zuege, beschaeftigt, punkte, onEnde]);
  useEffect(() => {
    if (!meldung) return undefined;
    const t = setTimeout(() => setMeldung(null), 1100);
    return () => clearTimeout(t);
  }, [meldung]);

  const versuchen = async (a, b) => {
    setGewaehlt(null);
    if (beschaeftigt || zuege <= 0 || !nachbarn(a, b)) return;
    setBeschaeftigt(true);
    if (!gueltig(brett, a, b)) {
      // Geht nicht: kurz tauschen, wackeln, zurück
      setBrett(tausch(brett, a, b));
      await pause(WARTEN.tausch);
      setWackelt([a, b]);
      setBrett(brett);
      await pause(WARTEN.platzen);
      if (!lebtRef.current) return;
      setWackelt([]);
      setBeschaeftigt(false);
      return;
    }
    const r = zug(brett, a, b, Math.random, idRef.current);
    idRef.current = r.naechsteId;
    let vorher = r.schritte[0].brett;
    setBrett(vorher);
    await pause(WARTEN.tausch);
    for (const sch of r.schritte.slice(1)) {
      if (!lebtRef.current) return;
      if (sch.weg.length) {
        setWeg(sch.weg.map((i) => vorher[i].id));
        if (sch.kette > 1) setMeldung(`Kette ×${sch.kette}!`);
        await pause(WARTEN.platzen);
      }
      if (sch.gemischt) setMeldung('Neu gemischt');
      setWeg([]);
      setBrett(sch.brett);
      vorher = sch.brett;
      await pause(WARTEN.fallen);
    }
    if (!lebtRef.current) return;
    if (r.extra > 0) setMeldung(`+${r.extra} ${r.extra === 1 ? 'Zug' : 'Züge'} geschenkt`);
    setPunkte((p) => p + r.punkte);
    setZuege((z) => z - 1 + r.extra);
    setBeschaeftigt(false);
  };

  const tippen = (i) => {
    if (gewaehlt === null) { setGewaehlt(i); return; }
    if (gewaehlt === i) { setGewaehlt(null); return; }
    if (nachbarn(gewaehlt, i)) { versuchen(gewaehlt, i); return; }
    setGewaehlt(i);
  };

  // Wischen: Richtung der Bewegung bestimmt den Nachbarn
  const runter = (i, e) => { wischRef.current = { i, x: e.clientX, y: e.clientY }; };
  const hoch = (i, e) => {
    const w = wischRef.current;
    wischRef.current = null;
    if (!w) return;
    const dx = e.clientX - w.x;
    const dy = e.clientY - w.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) { tippen(i); return; }
    const z = zeileVon(w.i);
    const s = spalteVon(w.i);
    const ziel = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? (s < N - 1 ? w.i + 1 : null) : (s > 0 ? w.i - 1 : null))
      : (dy > 0 ? (z < N - 1 ? w.i + N : null) : (z > 0 ? w.i - N : null));
    if (ziel !== null) versuchen(w.i, ziel);
  };

  return (
    <div className="zimmer-spiel zimmer-spiel-dreier" role="application" aria-label="Leckerli-Drei – drei Gleiche in eine Reihe tauschen">
      <div className="dreier-brett" data-dreier-beschaeftigt={beschaeftigt ? '1' : '0'}>
        {brett.map((f, i) => (
          <button
            key={f.id} type="button"
            className={`dreier-feld art-${f.art} ${gewaehlt === i ? 'gewaehlt' : ''} ${weg.includes(f.id) ? 'platzt' : ''} ${wackelt.includes(i) ? 'wackelt' : ''}`}
            style={{ '--z': zeileVon(i), '--s': spalteVon(i) }}
            onPointerDown={(e) => runter(i, e)} onPointerUp={(e) => hoch(i, e)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tippen(i); } }}
            aria-label={`${f.art}, Zeile ${zeileVon(i) + 1}, Spalte ${spalteVon(i) + 1}`}
            data-feld={i} data-art={f.art}
          >
            <span className={`dreier-bild ${f.neu ? 'neu' : ''}`}>
              <svg viewBox="-20 -20 40 40" aria-hidden="true">{BILD[f.art]}</svg>
            </span>
          </button>
        ))}
        {meldung && <span className="dreier-meldung" role="status">{meldung}</span>}
      </div>
      <div className="zimmer-spiel-hud">
        <span><strong>{punkte}</strong> Punkte</span>
        <span data-dreier-zuege={zuege}>{zuege} {zuege === 1 ? 'Zug' : 'Züge'}</span>
        <button className="zimmer-knopf" onClick={() => onEnde(punkte)}>Fertig</button>
      </div>
    </div>
  );
}
