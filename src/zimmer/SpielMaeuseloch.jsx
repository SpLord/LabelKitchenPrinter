import { useEffect, useRef, useState } from 'react';
import { MAUS, mausPlan, vorDemLoch } from './maeuseloch.js';

const K = { stroke: '#2f2a26', strokeLinejoin: 'round', strokeLinecap: 'round' };

/* Spielzeugmaus, die aus dem Loch lugt – grau mit rosa Ohren und Schnur-Schwanz. */
const Maus = () => (
  <g {...K} strokeWidth="3.5">
    <path d="M18 -6 q22 4 26 -14" fill="none" strokeWidth="3" />
    <ellipse cx="0" cy="-10" rx="24" ry="17" fill="#d1d5db" />
    <circle cx="-14" cy="-26" r="9" fill="#fbcfe8" />
    <circle cx="8" cy="-27" r="9" fill="#fbcfe8" />
    <circle cx="-8" cy="-12" r="2.6" fill="#2f2a26" stroke="none" />
    <circle cx="4" cy="-12" r="2.6" fill="#2f2a26" stroke="none" />
    <circle cx="-2" cy="-4" r="3" fill="#f472b6" strokeWidth="2" />
  </g>
);

/*
  Mäuseloch: Maus antippen, solange sie herausschaut – die Katze springt
  hinterher. Jede Maus hat einen eigenen Timer für Auftauchen und Abtauchen;
  kein Takt pro Bild.
*/
export default function SpielMaeuseloch({ katze, onTreffer, onEnde }) {
  const [sichtbar, setSichtbar] = useState(null);   // { id, loch } | null
  const [erwischt, setErwischt] = useState(null);   // id der zuletzt getroffenen
  const [treffer, setTreffer] = useState(0);
  const [rest, setRest] = useState(MAUS.dauer);
  const [pops, setPops] = useState([]);
  const katzeRef = useRef(katze);
  katzeRef.current = katze;
  const onTrefferRef = useRef(onTreffer);
  onTrefferRef.current = onTreffer;

  useEffect(() => {
    const uhren = [];
    const beginn = Date.now();
    for (const m of mausPlan()) {
      uhren.push(setTimeout(() => setSichtbar({ id: m.id, loch: m.loch }), m.ab));
      uhren.push(setTimeout(() => setSichtbar((s) => (s?.id === m.id ? null : s)), m.ab + m.zeigt));
    }
    const zeit = setInterval(() => setRest(Math.max(0, MAUS.dauer - (Date.now() - beginn))), 250);
    return () => { uhren.forEach(clearTimeout); clearInterval(zeit); };
  }, []);

  useEffect(() => { if (rest === 0) onEnde(treffer); }, [rest, treffer, onEnde]);

  const tippen = (e) => {
    e.stopPropagation();
    if (!sichtbar || erwischt === sichtbar.id) return;
    const { id, loch } = sichtbar;
    setErwischt(id);
    setTreffer((n) => n + 1);
    setPops((p) => [...p.slice(-3), { id, x: MAUS.loecher[loch].x }]);
    katzeRef.current.folge(vorDemLoch(loch));
    onTrefferRef.current?.();
    // Die getroffene Maus huscht sofort zurück ins Loch
    setTimeout(() => setSichtbar((s) => (s?.id === id ? null : s)), 220);
  };

  const y = MAUS.leisteY;
  return (
    <div className="zimmer-spiel zimmer-spiel-maus" role="application" aria-label="Mäuseloch – Maus antippen, bevor sie verschwindet">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg">
        {MAUS.loecher.map((l, i) => (
          <g key={l.x} transform={`translate(${l.x} ${y})`}>
            <path d="M-34 10 v-18 a34 34 0 0 1 68 0 v18 Z" fill="#3f2a1e" {...K} strokeWidth="4" />
            {sichtbar?.loch === i && (
              <g className={`zimmer-maus ${erwischt === sichtbar.id ? 'erwischt' : ''}`}
                 onPointerDown={tippen} role="button" aria-label="Maus fangen" data-maus="">
                <rect x="-60" y="-90" width="120" height="110" fill="transparent" />
                <g transform="translate(0 6)"><Maus /></g>
              </g>
            )}
            {/* Fussleiste vor dem Loch: die Maus kommt dahinter hervor */}
            <rect x="-40" y="8" width="80" height="10" fill="#fff" />
          </g>
        ))}
      </svg>
      {pops.map((p) => (
        <span key={p.id} className="zimmer-spiel-plus zimmer-spiel-plus-oben" style={{ left: `${p.x / 10.24}%` }}>+1</span>
      ))}
      <div className="zimmer-spiel-hud">
        <span><strong>{treffer}</strong> {treffer === 1 ? 'Maus' : 'Mäuse'}</span>
        <span className="zimmer-spiel-zeit">{Math.ceil(rest / 1000)} s</span>
        <button className="zimmer-knopf" onClick={() => onEnde(treffer)}>Fertig</button>
      </div>
    </div>
  );
}
