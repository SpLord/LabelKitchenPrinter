import { useEffect, useRef, useState } from 'react';
import CatVariant from '../cat/CatVariant.jsx';
import useTakt from './useTakt.js';
import { ANGELN, FISCHE, angelLohn, angelSchritt, angelStart, spitze } from './angeln.js';

const K = { stroke: '#2f2a26', strokeLinejoin: 'round', strokeLinecap: 'round' };
const W = 1600;
const { ursprung: U, wasser: WS } = ANGELN;

/* Fische, nach links schwimmend gezeichnet; r aus FISCHE. */
function Fisch({ art }) {
  const { r } = FISCHE[art];
  if (art === 'schuh') {
    return (
      <g {...K} strokeWidth="3.5">
        <path d={`M${-r} ${-r * 0.2} q0 ${-r * 0.8} ${r * 0.6} ${-r * 0.8} h${r * 0.4} v${r * 0.5} q${r * 0.9} 0 ${r} ${r * 0.8} v${r * 0.3} h${-r * 2} Z`} fill="#78716c" />
        <path d={`M${-r * 0.3} ${-r * 0.6} h${r * 0.4}`} stroke="#d6d3d1" strokeWidth="2.5" />
      </g>
    );
  }
  const farbe = { klein: '#fb923c', mittel: '#60a5fa', gross: '#a78bfa', gold: '#facc15' }[art];
  return (
    <g {...K} strokeWidth="3.5">
      <path d={`M${r * 0.9} 0 l${r * 0.7} ${-r * 0.6} v${r * 1.2} Z`} fill={farbe} />
      <ellipse rx={r} ry={r * 0.62} fill={farbe} />
      <path d={`M${r * 0.15} ${-r * 0.55} q${r * 0.2} ${r * 0.55} 0 ${r * 1.1}`} fill="none" strokeWidth="2.5" opacity="0.5" />
      <circle cx={-r * 0.5} cy={-r * 0.12} r={Math.max(2.5, r * 0.12)} fill="#2f2a26" stroke="none" />
      {art === 'gold' && <path className="zimmer-funkeln" d="M0 -26 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" fill="#fff" strokeWidth="1.5" />}
    </g>
  );
}

const Haken = () => (
  <g {...K} fill="none" strokeWidth="4">
    <path d="M0 0 v14 a8 8 0 1 0 -12 4" />
    <path d="M-12 18 l-3 -6" strokeWidth="3" />
  </g>
);

/*
  Angeln (2.12.0): Sie sitzt auf dem Steg und hält die Angel; der Haken
  pendelt. Tippen wirft. Nach 60 Sekunden ist Schluss – ein Fang, der
  gerade hochkommt, zählt noch.
*/
export default function SpielAngeln({ fell, onEnde }) {
  const [s, setS] = useState(() => angelStart());
  const wurfRef = useRef(false);
  const fertigRef = useRef(false);
  const [plus, setPlus] = useState(null);
  const gefangenRef = useRef(0);

  useTakt((dt) => {
    const wurf = wurfRef.current;
    wurfRef.current = false;
    setS((alt) => angelSchritt(alt, dt, wurf));
  }, !s.vorbei);

  // Ein Fang ist oben: kurz "+Wert" über dem Steg
  useEffect(() => {
    if (s.gefangen.length === gefangenRef.current) return;
    gefangenRef.current = s.gefangen.length;
    const art = s.gefangen[s.gefangen.length - 1];
    setPlus({ id: s.gefangen.length, wert: FISCHE[art].wert, art });
  }, [s.gefangen]);
  useEffect(() => {
    if (!plus) return undefined;
    const t = setTimeout(() => setPlus(null), 900);
    return () => clearTimeout(t);
  }, [plus]);

  const ende = (punkte) => {
    if (fertigRef.current) return;
    fertigRef.current = true;
    onEnde({ punkte, lohn: angelLohn(punkte), fische: s.gefangen.length, gefangen: s.gefangen });
  };
  useEffect(() => {
    if (!s.vorbei) return undefined;
    const t = setTimeout(() => ende(s.punkte), 600);
    return () => clearTimeout(t);
  });

  const p = spitze(s);
  const rest = Math.max(0, ANGELN.dauer - s.zeit * 1000);
  return (
    <div className="zimmer-spiel zimmer-spiel-angeln" onPointerDown={() => { wurfRef.current = true; }}
         role="application" aria-label="Angeln – tippen wirft den Haken" data-angel={s.zustand}>
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg" overflow="visible" aria-hidden="true">
        {/* Himmel, Ufer, Teich */}
        <rect x={-W} y={-W} width={1024 + 2 * W} height={W + 300} fill="#bae6fd" />
        <path d={`M${-W} 250 Q200 170 420 230 T900 210 T${1024 + W} 240 V300 H${-W} Z`} fill="#86efac" {...K} strokeWidth="4" />
        <rect x={-W} y={WS.oben - 10} width={1024 + 2 * W} height={W + 768} fill="#38bdf8" />
        <rect x={-W} y={WS.oben + 160} width={1024 + 2 * W} height={W + 768} fill="#0ea5e9" opacity="0.55" />
        <rect x={-W} y={WS.oben + 330} width={1024 + 2 * W} height={W + 768} fill="#0369a1" opacity="0.45" />
        <g className="zimmer-wellen" fill="none" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round">
          {[-200, 100, 400, 700, 1000].map((x) => <path key={x} d={`M${x} ${WS.oben + 6} q20 -10 40 0 q20 10 40 0`} />)}
        </g>
        {/* Seegras am Grund */}
        <g fill="#15803d" opacity="0.7">
          {[90, 230, 420, 610, 800, 950].map((x, i) => <path key={x} className="zimmer-gras" style={{ animationDelay: `${-i * 0.5}s` }} d={`M${x} 770 q-14 -50 4 -90 q-4 50 10 90 Z`} />)}
        </g>

        {s.fische.map((f) => (
          <g key={f.id} transform={`translate(${f.x} ${f.y}) scale(${f.vx > 0 ? -1 : 1} 1)`} data-fisch={f.art}>
            <Fisch art={f.art} />
          </g>
        ))}

        {/* Steg mit Katze und Angel */}
        <g {...K} strokeWidth="5">
          <rect x="380" y="140" width="264" height="26" rx="5" fill="#a16207" />
          <path d="M410 166 V320 M614 166 V320" strokeWidth="10" stroke="#78350f" />
        </g>
        <svg x="408" y="34" width="120" height="120" viewBox="0 0 200 200" overflow="visible">
          <CatVariant index={fell} active={s.zustand !== 'pendelt'} zubehoer={{}} />
        </svg>
        <path d={`M470 110 Q500 60 ${U.x} ${U.y - 40}`} fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
        <line x1={U.x} y1={U.y - 40} x2={p.x} y2={p.y} stroke="#f8fafc" strokeWidth="2.5" />
        <g transform={`translate(${p.x} ${p.y}) rotate(${-s.winkel})`} data-haken="">
          <Haken />
          {s.fang && <g transform={`translate(-6 ${FISCHE[s.fang.art].r + 16}) rotate(-90)`}><Fisch art={s.fang.art} /></g>}
        </g>

        {plus && (
          <text key={plus.id} x="600" y="120" className="zimmer-angel-plus" textAnchor="middle" fontSize="40" fontWeight="800"
                fill={plus.wert > 0 ? '#b45309' : '#57534e'} fontFamily="Roboto, system-ui, sans-serif">
            {plus.wert > 0 ? `+${plus.wert}` : 'Schuh!'}
          </text>
        )}
      </svg>
      <div className="zimmer-spiel-hud">
        <span><strong>{s.punkte}</strong> Punkte</span>
        <span className="zimmer-spiel-zeit">{Math.ceil(rest / 1000)} s</span>
        <button className="zimmer-knopf" onPointerDown={(e) => e.stopPropagation()} onClick={() => ende(s.punkte)}>Fertig</button>
      </div>
    </div>
  );
}
