import { useState } from 'react';
import CatVariant from '../../cat/CatVariant.jsx';
import { Stern } from './ReiseLevel.jsx';
import { LEVEL, WELTEN, freigeschaltet, gesamtSterne, naechstesLevel } from './level.js';

/* Zehn Stationen je Welt auf einem Schlangenweg (zwei Reihen à fünf). */
const ORT = Array.from({ length: 10 }, (_, k) => {
  const reihe = Math.floor(k / 5);
  const pos = k % 5;
  return { x: 110 + (reihe === 0 ? pos : 4 - pos) * 200, y: reihe === 0 ? 150 : 400 };
});
const WEG = `M${ORT[0].x} ${ORT[0].y} ${ORT.slice(1).map((p, k) => (k === 4 ? `C${p.x + 170} ${ORT[4].y} ${p.x + 170} ${p.y} ${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(' ')}`;

/* Kleine Kulisse je Welt, nur zur Stimmung. */
const KULISSE = {
  kueche: <g opacity="0.5" fill="#fff" stroke="#2f2a26" strokeWidth="4"><rect x="40" y="250" width="120" height="70" rx="10" /><circle cx="960" cy="270" r="40" /><path d="M500 250 h90 v60 h-90 Z" /></g>,
  garten: <g opacity="0.5" stroke="#2f2a26" strokeWidth="4"><circle cx="70" cy="280" r="34" fill="#f472b6" /><circle cx="960" cy="260" r="40" fill="#fde047" /><path d="M520 300 q20 -60 40 0" fill="#22c55e" /></g>,
  dachboden: <g opacity="0.5" stroke="#2f2a26" strokeWidth="4" fill="#fff"><path d="M40 320 l60 -90 l60 90 Z" /><rect x="900" y="230" width="90" height="90" rx="6" /><path d="M500 300 h100" /></g>,
};

export default function ReiseKarte({ fortschritt, fell, onLevel, onZu }) {
  const naechstes = naechstesLevel(fortschritt);
  const [welt, setWelt] = useState(() => LEVEL[naechstes - 1].welt);
  const levels = LEVEL.filter((l) => l.welt === welt);
  return (
    <div className="reise-karte" style={{ '--welt': WELTEN.find((w) => w.id === welt).farbe }} data-reise-karte={welt}>
      <header className="reise-kopf">
        <h2>Leckerli-Reise</h2>
        <span className="reise-gesamt"><Stern /> {gesamtSterne(fortschritt)} / {LEVEL.length * 3}</span>
        <button className="zimmer-knopf" onClick={onZu}>Zurück ins Zimmer</button>
      </header>
      <nav className="reise-welten" aria-label="Welten">
        {WELTEN.map((w, k) => {
          const offen = freigeschaltet(fortschritt, k * 10 + 1);
          return (
            <button key={w.id} className={`${w.id === welt ? 'aktiv' : ''}`} disabled={!offen} onClick={() => setWelt(w.id)}
                    style={{ '--farbe': w.farbe }}>
              {offen ? '' : '🔒 '}{w.name}
            </button>
          );
        })}
      </nav>
      <svg viewBox="0 0 1024 520" className="reise-weg" role="list" aria-label="Level">
        {KULISSE[welt]}
        <path d={WEG} fill="none" stroke="#fff" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
        <path d={WEG} fill="none" stroke="#2f2a26" strokeWidth="5" strokeDasharray="2 16" strokeLinecap="round" />
        {levels.map((l, k) => {
          const { x, y } = ORT[k];
          const offen = freigeschaltet(fortschritt, l.nr);
          const st = fortschritt.sterne[l.nr] ?? 0;
          const hier = l.nr === naechstes;
          return (
            <g key={l.nr} transform={`translate(${x} ${y})`} role="listitem">
              {/* Pulsierender Ring hinter der Station – die Station selbst bleibt ruhig (antippbar) */}
              {hier && <circle r="54" className="reise-halo" fill="none" stroke="#ef4444" strokeWidth="6" pointerEvents="none" />}
              <g className={`reise-station ${offen ? 'offen' : 'zu'} ${hier ? 'hier' : ''} ${st > 0 ? 'geschafft' : ''}`}
                 onClick={offen ? () => onLevel(l.nr) : undefined}
                 role="button" aria-label={`Level ${l.nr}${offen ? '' : ' (gesperrt)'}${st ? `, ${st} Sterne` : ''}`}
                 aria-disabled={!offen} data-station={l.nr}>
                <circle r="46" fill={offen ? '#fff' : '#d6d3d1'} stroke="#2f2a26" strokeWidth="6" />
                <text y="14" textAnchor="middle" fontSize="40" fontWeight="800" fill="#2f2a26" fontFamily="Roboto, system-ui, sans-serif">
                  {offen ? l.nr : '🔒'}
                </text>
              </g>
              {offen && st > 0 && (
                <g transform="translate(-42 46)">
                  {[1, 2, 3].map((n) => (
                    <svg key={n} x={(n - 1) * 28} y="0" width="28" height="28" viewBox="-12 -12 24 24" aria-hidden="true">
                      <path d="M0 -10 L3 -3.5 L10 -3 L4.6 1.8 L6.2 9 L0 5.2 L-6.2 9 L-4.6 1.8 L-10 -3 L-3 -3.5 Z" fill={st >= n ? '#facc15' : '#e5e7eb'} stroke="#2f2a26" strokeWidth="2" />
                    </svg>
                  ))}
                </g>
              )}
              {hier && (
                <svg x="-40" y="-150" width="80" height="80" viewBox="0 0 200 200" overflow="visible" className="reise-mieze" aria-hidden="true">
                  <CatVariant index={fell} active zubehoer={{}} />
                </svg>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
