import { useEffect, useRef, useState } from 'react';
import { FEDER, inReichweite, zielUnterFeder } from './spiele.js';

const K = { stroke: '#2f2a26', strokeLinejoin: 'round', strokeLinecap: 'round' };

/* Fingerposition in Szenenpunkte (1024 × 768) umrechnen. */
export const inSzene = (e, element) => {
  const r = element.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * 1024, y: ((e.clientY - r.top) / r.height) * 768 };
};

/*
  Federangel: Man führt eine Feder an einer Schnur, Mails rennt hinterher.
  Hängt die Feder tief genug und lange genug in ihrer Reichweite, fängt sie
  sie – dann springt die Feder weg und es geht weiter. Bringt Laune und
  Freundschaft, keine Münzen (Design 2026-10-06: Spielen ist Zuwendung).
*/
export default function SpielFederangel({ katze, onFang, onEnde }) {
  const flaecheRef = useRef(null);
  const [feder, setFeder] = useState({ x: 600, y: 540 });
  const federRef = useRef(feder);
  federRef.current = feder;
  const [faenge, setFaenge] = useState(0);
  const [rest, setRest] = useState(FEDER.dauer);
  const [fang, setFang] = useState(0);
  const katzeRef = useRef(katze);
  katzeRef.current = katze;
  const onFangRef = useRef(onFang);
  onFangRef.current = onFang;

  // Takt: Katze hinterherschicken, Fang prüfen, Zeit zählen
  useEffect(() => {
    const beginn = Date.now();
    let letztesZiel = null;
    let inReichSeit = null;
    const id = setInterval(() => {
      const k = katzeRef.current;
      const f = federRef.current;
      const ziel = zielUnterFeder(f);
      if (!letztesZiel || Math.hypot(ziel.x - letztesZiel.x, ziel.y - letztesZiel.y) > 28) {
        k.folge(ziel);
        letztesZiel = ziel;
      }
      if (!k.laeuft && inReichweite(k.wo(), f)) {
        inReichSeit ??= Date.now();
        if (Date.now() - inReichSeit >= FEDER.haltezeit) {
          // Gefangen! Die Feder reisst sich los und springt weg
          setFaenge((n) => n + 1);
          setFang((n) => n + 1);
          onFangRef.current?.();
          inReichSeit = null;
          setFeder((alt) => ({ x: alt.x > 512 ? alt.x - 260 : alt.x + 260, y: 420 }));
        }
      } else {
        inReichSeit = null;
      }
      const uebrig = Math.max(0, FEDER.dauer - (Date.now() - beginn));
      setRest(uebrig);
      if (uebrig === 0) clearInterval(id);
    }, 150);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (rest === 0) onEnde(faenge); }, [rest, faenge, onEnde]);

  const bewegen = (e) => { if (flaecheRef.current) setFeder(inSzene(e, flaecheRef.current)); };

  // Angel: der Stock kommt von oben rechts, die Schnur hängt zur Feder
  const spitze = { x: Math.min(1000, feder.x + 150), y: 70 };
  return (
    <div className="zimmer-spiel" ref={flaecheRef} onPointerMove={bewegen} onPointerDown={bewegen}
         role="application" aria-label="Federangel – mit dem Finger die Feder führen">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg" aria-hidden="true">
        <line x1={spitze.x + 120} y1={-20} x2={spitze.x} y2={spitze.y} stroke="#a16207" strokeWidth="10" strokeLinecap="round" />
        <line x1={spitze.x + 120} y1={-20} x2={spitze.x} y2={spitze.y} stroke="#2f2a26" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
        <path d={`M${spitze.x} ${spitze.y} Q${(spitze.x + feder.x) / 2} ${Math.max(spitze.y, feder.y) + 40} ${feder.x} ${feder.y - 26}`}
              fill="none" stroke="#2f2a26" strokeWidth="2.5" />
        <g transform={`translate(${feder.x} ${feder.y})`} className="zimmer-feder" {...K}>
          <path d="M0 -28 C-22 -10 -18 18 0 30 C18 18 22 -10 0 -28 Z" fill="#f472b6" strokeWidth="3.5" />
          <path d="M0 -24 V30" strokeWidth="2.5" />
          <path d="M0 -6 l-10 -6 M0 6 l-12 -4 M0 -6 l10 -6 M0 6 l12 -4" strokeWidth="2" />
          <circle cx="0" cy="-28" r="5" fill="#fbbf24" strokeWidth="2.5" />
        </g>
      </svg>
      {fang > 0 && <span key={fang} className="zimmer-spiel-pop">Gefangen!</span>}
      <div className="zimmer-spiel-hud">
        <span><strong>{faenge}</strong> {faenge === 1 ? 'Fang' : 'Fänge'}</span>
        <span className="zimmer-spiel-zeit">{Math.ceil(rest / 1000)} s</span>
        <button className="zimmer-knopf" onClick={() => onEnde(faenge)}>Fertig</button>
      </div>
    </div>
  );
}
