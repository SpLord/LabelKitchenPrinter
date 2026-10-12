import { useEffect, useRef, useState } from 'react';
import { KISSEN, NACHMACHEN, naechsteRunde, nachmachenRunden, nachmachenStart, nachmachenTipp } from './spiele3.js';

const KISSEN_Y = 615;   // über der Spielleiste unten

/*
  Nachmachen (2.10.0): Die Katze läuft eine Folge von Kissen ab und tippt
  jedes mit der Pfote an – es leuchtet auf. Danach ist man dran. Jede Runde
  wird die Folge eins länger. Ein Fehler beendet das Spiel.
*/
export default function SpielNachmachen({ katze, onEnde }) {
  const [s, setS] = useState(() => nachmachenStart());
  const [leuchtet, setLeuchtet] = useState(null);
  const katzeRef = useRef(katze);
  katzeRef.current = katze;
  const onEndeRef = useRef(onEnde);
  onEndeRef.current = onEnde;

  // Sie zeigt vor: zu jedem Kissen laufen, es leuchtet auf
  useEffect(() => {
    if (s.phase !== 'zeigen') return undefined;
    const uhren = [];
    s.folge.forEach((k, i) => {
      uhren.push(setTimeout(() => {
        katzeRef.current.folge({ x: KISSEN[k].x, y: KISSEN_Y - 40 });
        setLeuchtet(k);
      }, 600 + i * NACHMACHEN.zeigen));
      uhren.push(setTimeout(() => setLeuchtet(null), 600 + i * NACHMACHEN.zeigen + NACHMACHEN.zeigen * 0.7));
    });
    uhren.push(setTimeout(() => setS((alt) => ({ ...alt, phase: 'nachmachen' })), 600 + s.folge.length * NACHMACHEN.zeigen));
    return () => uhren.forEach(clearTimeout);
  }, [s.phase, s.folge]);

  // Runde geschafft → nächste; falsch oder alle geschafft → Ende
  useEffect(() => {
    if (s.phase === 'geschafft') {
      const t = setTimeout(() => setS((alt) => naechsteRunde(alt)), 700);
      return () => clearTimeout(t);
    }
    if (s.phase === 'falsch' || s.phase === 'fertig') {
      const t = setTimeout(() => onEndeRef.current(nachmachenRunden(s)), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [s]);

  useEffect(() => {
    if (leuchtet === null || s.phase === 'zeigen') return undefined;
    const t = setTimeout(() => setLeuchtet(null), 260);
    return () => clearTimeout(t);
  }, [leuchtet, s.phase]);

  const tippen = (k) => {
    if (s.phase !== 'nachmachen') return;
    setLeuchtet(k);
    setS((alt) => nachmachenTipp(alt, k));
  };

  const text = { zeigen: 'Pass auf …', nachmachen: 'Du bist dran!', geschafft: 'Richtig!', falsch: 'Oh, falsch', fertig: 'Alles richtig!' }[s.phase];
  return (
    <div className={`zimmer-spiel zimmer-spiel-nachmachen phase-${s.phase}`} role="application" aria-label="Nachmachen – tippe die Kissen in derselben Reihenfolge">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg">
        {KISSEN.map((k, i) => (
          <g key={k.x} transform={`translate(${k.x} ${KISSEN_Y})`} onPointerDown={() => tippen(i)}
             role="button" aria-label={`Kissen ${i + 1}`} data-kissen={i}>
            {/* Animation auf der inneren Ebene – sonst überschreibt sie das translate */}
            <g key={leuchtet === i ? `an-${s.eingabe}-${s.folge.length}` : 'aus'} className={`zimmer-kissen ${leuchtet === i ? 'leuchtet' : ''}`}>
              <ellipse cx="0" cy="8" rx="66" ry="14" fill="#9c6b3e" opacity="0.25" />
              <ellipse cx="0" cy="0" rx="62" ry="24" fill={leuchtet === i ? k.hell : k.farbe} stroke="#2f2a26" strokeWidth="5" />
              <path d="M-30 -6 q30 10 60 0" fill="none" stroke="#2f2a26" strokeWidth="3" opacity="0.4" />
            </g>
          </g>
        ))}
      </svg>
      <div className="zimmer-spiel-hud">
        <span>Runde <strong>{s.folge.length}</strong> / {NACHMACHEN.runden}</span>
        <span data-nachmachen-phase={s.phase}>{text}</span>
        <button className="zimmer-knopf" onClick={() => onEnde(nachmachenRunden(s))}>Fertig</button>
      </div>
    </div>
  );
}
