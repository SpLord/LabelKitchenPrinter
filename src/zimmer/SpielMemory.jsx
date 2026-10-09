import { useEffect, useState } from 'react';
import { FundstueckBild } from './Fensterwelt.jsx';
import { memoryFertig, memoryMischen, memoryZug } from './spiele2.js';

/*
  Memory (2.8.0) mit den Fundstücken: sechs Paare. Zwei falsche Karten
  drehen sich nach kurzer Zeit von selbst zurück. Je weniger Züge, desto
  mehr Münzen.
*/
export default function SpielMemory({ onEnde }) {
  const [s, setS] = useState(() => ({ karten: memoryMischen(), offen: [], gefunden: [], zuege: 0 }));

  // Falsches Paar: nach 0,9 s wieder zu
  useEffect(() => {
    if (s.offen.length !== 2) return undefined;
    const t = setTimeout(() => setS((alt) => (alt.offen.length === 2 ? { ...alt, offen: [] } : alt)), 900);
    return () => clearTimeout(t);
  }, [s.offen]);

  useEffect(() => {
    if (!memoryFertig(s)) return undefined;
    const t = setTimeout(() => onEnde(s.zuege), 700);
    return () => clearTimeout(t);
  }, [s, onEnde]);

  return (
    <div className="zimmer-spiel zimmer-spiel-memory" role="application" aria-label="Memory mit Fundstücken">
      <div className="zimmer-memory">
        {s.karten.map((bild, i) => {
          const sichtbar = s.offen.includes(i) || s.gefunden.includes(i);
          return (
            <button key={i} type="button" className={`zimmer-memory-karte ${sichtbar ? 'offen' : ''} ${s.gefunden.includes(i) ? 'gefunden' : ''}`}
                    onClick={() => setS((alt) => memoryZug(alt, i))} aria-label={sichtbar ? bild : `Karte ${i + 1}`} data-karte={i}>
              <svg viewBox="-26 -26 52 52" aria-hidden="true">
                {sichtbar
                  ? <FundstueckBild id={bild} />
                  : <g fill="#fde68a" stroke="#2f2a26" strokeWidth="2.5"><ellipse cx="0" cy="6" rx="9" ry="7" /><circle cx="-10" cy="-6" r="4" /><circle cx="-3" cy="-11" r="4" /><circle cx="4" cy="-11" r="4" /><circle cx="11" cy="-6" r="4" /></g>}
              </svg>
            </button>
          );
        })}
      </div>
      <div className="zimmer-spiel-hud">
        <span><strong>{s.gefunden.length / 2}</strong> / {s.karten.length / 2} Paare</span>
        <span>{s.zuege} Züge</span>
        <button className="zimmer-knopf" onClick={() => onEnde(null)}>Fertig</button>
      </div>
    </div>
  );
}
