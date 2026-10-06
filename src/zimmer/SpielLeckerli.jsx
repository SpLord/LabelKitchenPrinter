import { useEffect, useRef, useState } from 'react';
import { inSzene } from './SpielFederangel.jsx';
import { LECKERLI, fallplan, gefangen } from './spiele.js';

const K = { stroke: '#2f2a26', strokeLinejoin: 'round', strokeLinecap: 'round' };

const Leckerli = ({ art }) => (art === 'fisch'
  ? <g {...K} strokeWidth="3.5"><path d="M-20 0 q14 -16 30 0 q-16 16 -30 0 Z" fill="#fb923c" /><path d="M-20 0 l-12 -9 v18 Z" fill="#fb923c" /><circle cx="2" cy="-2" r="2.5" fill="#2f2a26" stroke="none" /></g>
  : <g {...K} strokeWidth="3.5"><circle r="15" fill="#d6a15d" /><circle cx="-5" cy="-4" r="2.5" fill="#7c4a1e" stroke="none" /><circle cx="5" cy="3" r="2.5" fill="#7c4a1e" stroke="none" /><circle cx="-2" cy="7" r="2" fill="#7c4a1e" stroke="none" /></g>);

/*
  Leckerli fangen: Leckerlis fallen, man schiebt den Napf darunter.
  Bis zu 10 Münzen je Runde, eine Runde pro Stunde (Design 2026-10-06 – die
  Münzquelle, die mit dem alten Leckerli-Regen wegfiel, jetzt mit Grenze).

  Kein Takt pro Bild: jedes Leckerli fällt per CSS-Animation, und ob es im
  Napf landet, prüft ein einzelner Timer genau dann, wenn es unten ankommt.
*/
export default function SpielLeckerli({ onEnde }) {
  const flaecheRef = useRef(null);
  const [napfX, setNapfX] = useState(512);
  const napfRef = useRef(512);
  const [fallend, setFallend] = useState([]);   // { id, x, fallzeit, art, status }
  const [faenge, setFaenge] = useState(0);
  const [rest, setRest] = useState(LECKERLI.dauer);
  const [pops, setPops] = useState([]);

  useEffect(() => {
    const plan = fallplan();
    const uhren = [];
    const beginn = Date.now();
    for (const l of plan) {
      uhren.push(setTimeout(() => setFallend((f) => [...f, { ...l, status: 'faellt' }]), l.ab));
      uhren.push(setTimeout(() => {
        const drin = gefangen(l.x, napfRef.current);
        if (drin) {
          setFaenge((n) => n + 1);
          setPops((p) => [...p.slice(-4), { id: l.id, x: l.x }]);
        }
        setFallend((f) => f.map((e) => (e.id === l.id ? { ...e, status: drin ? 'gefangen' : 'daneben' } : e)));
        // Nach kurzer Zeit wegräumen
        uhren.push(setTimeout(() => setFallend((f) => f.filter((e) => e.id !== l.id)), 700));
      }, l.ab + l.fallzeit));
    }
    const zeit = setInterval(() => {
      const uebrig = Math.max(0, LECKERLI.dauer - (Date.now() - beginn));
      setRest(uebrig);
    }, 250);
    return () => { uhren.forEach(clearTimeout); clearInterval(zeit); };
  }, []);

  useEffect(() => { if (rest === 0) onEnde(faenge); }, [rest, faenge, onEnde]);

  const bewegen = (e) => {
    if (!flaecheRef.current) return;
    const x = Math.max(LECKERLI.links, Math.min(LECKERLI.rechts, inSzene(e, flaecheRef.current).x));
    napfRef.current = x;
    setNapfX(x);
  };

  const strecke = LECKERLI.napfHoehe - LECKERLI.start;
  return (
    <div className="zimmer-spiel" ref={flaecheRef} onPointerMove={bewegen} onPointerDown={bewegen}
         role="application" aria-label="Leckerli fangen – den Napf mit dem Finger verschieben">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg" aria-hidden="true">
        {fallend.map((l) => (
          <g key={l.id} transform={`translate(${l.x} ${LECKERLI.start})`}>
            <g className={`zimmer-leckerli ${l.status}`}
               style={{ '--strecke': `${strecke}px`, animationDuration: `${l.fallzeit}ms` }}>
              <Leckerli art={l.art} />
            </g>
          </g>
        ))}
        {/* Der Napf folgt dem Finger */}
        <g transform={`translate(${napfX} ${LECKERLI.napfHoehe + 26})`} {...K} strokeWidth="5">
          {/* Golden statt rot: sonst sähe es aus wie ein zweiter Futternapf */}
          <path d="M-58 -26 h116 l-10 34 h-96 Z" fill="#fbbf24" />
          <ellipse cx="0" cy="-26" rx="58" ry="10" fill="#b45309" strokeWidth="4" />
          <path d="M-30 -6 h60" stroke="#fde68a" strokeWidth="5" />
        </g>
      </svg>
      {pops.map((p) => (
        <span key={p.id} className="zimmer-spiel-plus" style={{ left: `${p.x / 10.24}%` }}>+1</span>
      ))}
      <div className="zimmer-spiel-hud">
        <span><strong>{Math.min(faenge, LECKERLI.maxMuenzen)}</strong> / {LECKERLI.maxMuenzen} Münzen</span>
        <span className="zimmer-spiel-zeit">{Math.ceil(rest / 1000)} s</span>
        <button className="zimmer-knopf" onClick={() => onEnde(faenge)}>Fertig</button>
      </div>
    </div>
  );
}
