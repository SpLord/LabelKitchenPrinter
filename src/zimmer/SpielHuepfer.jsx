import { useEffect, useRef, useState } from 'react';
import KatzePose from './KatzePose.jsx';
import Bestenliste from './Bestenliste.jsx';
import useTakt from './useTakt.js';
import { HINDERNISSE, HUEPFER, huepferLohn, huepferStart, meter, schritt } from './huepfer.js';

const K = { stroke: '#2f2a26', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' };
const W = 1600;   // so weit reicht der Flur über die Szene hinaus (breite Bildschirme)
const B = HUEPFER.boden;

/* Hindernisse, gezeichnet mit dem Fusspunkt bei (0, 0). */
const BILD = {
  gurke: (
    <g {...K}>
      <path d="M-32 -4 C-34 -26 30 -34 32 -12 C34 4 -30 12 -32 -4 Z" fill="#4ade80" />
      <g fill="#166534" stroke="none"><circle cx="-14" cy="-14" r="2.5" /><circle cx="0" cy="-20" r="2.5" /><circle cx="14" cy="-14" r="2.5" /><circle cx="6" cy="-6" r="2.5" /></g>
      <path d="M30 -16 q6 -4 8 -10" fill="none" strokeWidth="3" />
    </g>
  ),
  karton: (
    <g {...K}>
      <rect x="-37" y="-62" width="74" height="62" rx="3" fill="#d6a15d" />
      <path d="M-37 -62 l-8 -12 M37 -62 l8 -12" fill="none" />
      <path d="M-14 -62 v20 M14 -62 v20" stroke="#b07a3a" strokeWidth="3" />
    </g>
  ),
  staubsauger: (
    <g {...K}>
      <rect x="-30" y="-46" width="60" height="42" rx="18" fill="#ef4444" />
      <circle cx="-18" cy="-4" r="8" fill="#4b5563" /><circle cx="18" cy="-4" r="8" fill="#4b5563" />
      <path d="M8 -46 C14 -80 30 -92 22 -92" fill="none" strokeWidth="6" stroke="#4b5563" />
      <rect x="-12" y="-38" width="16" height="10" rx="4" fill="#fecaca" strokeWidth="3" />
    </g>
  ),
};

/*
  Gurkenhüpfer (2.12.0): eigener Flur statt Zimmer, die Katze rennt auf der
  Stelle, Wand und Boden ziehen vorbei. Tippen (oder Leertaste) = Sprung,
  in der Luft noch einmal. Erst beim ersten Tipp geht es los.
*/
export default function SpielHuepfer({ fell, zubehoer, onEnde }) {
  const [s, setS] = useState(huepferStart);
  const [los, setLos] = useState(false);
  const sprungRef = useRef(false);
  const fertigRef = useRef(false);
  // Endbild mit Bestenliste: nach dem Zusammenstoss oder auf "Fertig"
  const [abschluss, setAbschluss] = useState(null);

  useTakt((dt) => {
    const sprung = sprungRef.current;
    sprungRef.current = false;
    setS((alt) => schritt(alt, dt, sprung));
  }, los && !s.vorbei && !abschluss);

  const tippen = () => {
    if (s.vorbei) return;
    if (!los) setLos(true);
    sprungRef.current = true;
  };
  useEffect(() => {
    const taste = (e) => {
      if (abschluss || e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); tippen(); }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  });

  const ende = (lauf) => {
    if (fertigRef.current) return;
    fertigRef.current = true;
    setAbschluss({ lohn: huepferLohn(lauf), meter: meter(lauf), muenzen: lauf.gesammelt });
  };
  useEffect(() => {
    if (!s.vorbei) return undefined;
    const t = setTimeout(() => ende(s), 1400);
    return () => clearTimeout(t);
  });

  // Wand und Boden ziehen vorbei, die Wand langsamer (Tiefe)
  const wand = -((s.strecke * 0.5) % 140);
  const boden = -(s.strecke % 120);
  const bilder = -((s.strecke * 0.5) % 700);
  const pose = s.vorbei ? 'krank' : 'laufen';
  return (
    <div className={`zimmer-spiel zimmer-spiel-huepfer ${s.katze.y > 0 ? 'in-der-luft' : ''}`} onPointerDown={tippen}
         role="application" aria-label="Gurkenhüpfer – tippen zum Springen" data-huepfer={s.vorbei ? 'vorbei' : los ? 'laeuft' : 'bereit'}>
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg" overflow="visible" aria-hidden="true">
        <rect x={-W} y={-W} width={1024 + 2 * W} height={W + 470} fill="#e0e7ff" />
        <g fill="#c7d2fe" transform={`translate(${wand} 0)`}>
          {Array.from({ length: 50 }, (_, i) => <rect key={i} x={-W + i * 140} y={-W} width="16" height={W + 470} />)}
        </g>
        {/* Bilder an der Wand, damit man das Tempo sieht */}
        <g transform={`translate(${bilder} 0)`} {...K}>
          {[-1400, -700, 0, 700, 1400, 2100].map((x) => (
            <g key={x} transform={`translate(${x + 300} 210)`}>
              <rect x="-60" y="-50" width="120" height="96" rx="6" fill="#fff" />
              <rect x="-48" y="-38" width="96" height="72" fill="#fde68a" strokeWidth="3" />
              <circle cx="0" cy="-2" r="18" fill="#fb923c" strokeWidth="3" />
            </g>
          ))}
        </g>
        <rect x={-W} y="466" width={1024 + 2 * W} height={302 + W} fill="#e3b88b" />
        <rect x={-W} y="458" width={1024 + 2 * W} height="14" fill="#fff" />
        <line x1={-W} y1="472" x2={1024 + W} y2="472" {...K} />
        <g stroke="#c4935f" strokeWidth="4" transform={`translate(${boden} 0)`}>
          {[560, 660].map((y) => <line key={y} x1={-W} y1={y} x2={1024 + W} y2={y} />)}
          {Array.from({ length: 40 }, (_, i) => <line key={i} x1={-W + i * 120} y1="560" x2={-W + i * 120 - 10} y2="660" />)}
        </g>

        {s.muenzen.map((m) => (
          <g key={m.id} transform={`translate(${m.x} ${B - m.hoehe})`} data-huepfer-muenze="">
            <circle r="15" fill="#fbbf24" {...K} strokeWidth="3.5" />
            <circle r="7" fill="none" stroke="#b45309" strokeWidth="2.5" />
          </g>
        ))}
        {s.hindernisse.map((o) => (
          <g key={o.id} transform={`translate(${o.x} ${B})`} data-hindernis={o.art}>
            <ellipse cx="0" cy="2" rx={HINDERNISSE[o.art].b / 2 + 6} ry="7" fill="#9c6b3e" opacity="0.3" />
            {BILD[o.art]}
          </g>
        ))}

        {/* Die Katze, gespiegelt: gezeichnet schaut sie nach links */}
        <ellipse cx={HUEPFER.katzeX} cy={B + 2} rx={44 - Math.min(24, s.katze.y / 6)} ry="8" fill="#9c6b3e" opacity="0.3" />
        <g transform={`translate(${HUEPFER.katzeX} ${B - s.katze.y}) scale(-1 1) translate(-60 -112)`} data-huepfer-katze={Math.round(s.katze.y)}>
          <svg width="120" height="120" viewBox="0 0 200 200" overflow="visible">
            <KatzePose pose={pose} fell={fell} zubehoer={zubehoer} aktiv />
          </svg>
        </g>

        {!los && (
          <g className="zimmer-huepfer-hinweis" transform="translate(512 330)">
            <rect x="-260" y="-46" width="520" height="92" rx="46" fill="#fff" {...K} />
            <text textAnchor="middle" y="12" fontSize="34" fontWeight="800" fill="#2f2a26" fontFamily="Roboto, system-ui, sans-serif">Tippen zum Springen!</text>
          </g>
        )}
        {s.vorbei && (
          <g transform="translate(512 330)" className="zimmer-huepfer-hinweis">
            <rect x="-220" y="-46" width="440" height="92" rx="46" fill="#fde047" {...K} />
            <text textAnchor="middle" y="12" fontSize="34" fontWeight="800" fill="#2f2a26" fontFamily="Roboto, system-ui, sans-serif">Autsch! {meter(s)} m</text>
          </g>
        )}
      </svg>
      {abschluss && (
        <div className="zimmer-spiel-schluss" onPointerDown={(e) => e.stopPropagation()}>
          <Bestenliste spiel="huepfer" wert={abschluss.meter} einheit="m" titel="Vorbei!"
                       zusatz={`${abschluss.muenzen} Münzen gesammelt · +${abschluss.lohn} Münzen`}
                       onFertig={() => onEnde(abschluss)} />
        </div>
      )}
      <div className="zimmer-spiel-hud">
        <span><strong>{meter(s)}</strong> m</span>
        <span><span className="zimmer-muenze" aria-hidden="true" /> <strong>{s.gesammelt}</strong></span>
        <button className="zimmer-knopf" onPointerDown={(e) => e.stopPropagation()} onClick={() => ende(s)}>Fertig</button>
      </div>
    </div>
  );
}
