import { useEffect, useRef, useState } from 'react';
import { inSzene } from './SpielFederangel.jsx';
import { LASER, gesprungen } from './spiele2.js';

/* Auf dem Boden bleibt sie: der Punkt darf an die Wand, sie springt nur bis zur Fussleiste. */
const amBoden = (p) => ({ x: Math.max(160, Math.min(980, p.x)), y: Math.max(570, Math.min(680, p.y)) });

/*
  Laserpointer (2.8.0): roter Punkt unter dem Finger, die Katze stürzt sich
  hinterher. Jedes Mal, wenn sie ihn erreicht, ist es ein Sprung – dann
  "flieht" der Punkt ein Stück. Bringt Laune, keine Münzen.
*/
export default function SpielLaser({ katze, onSprung, onEnde }) {
  const flaecheRef = useRef(null);
  const [punkt, setPunkt] = useState({ x: 560, y: 640 });
  const punktRef = useRef(punkt);
  punktRef.current = punkt;
  const [spruenge, setSpruenge] = useState(0);
  const [rest, setRest] = useState(LASER.dauer);
  const katzeRef = useRef(katze);
  katzeRef.current = katze;
  const onSprungRef = useRef(onSprung);
  onSprungRef.current = onSprung;

  useEffect(() => {
    const beginn = Date.now();
    let letztesZiel = null;
    let gezaehlt = false;
    const id = setInterval(() => {
      const k = katzeRef.current;
      const ziel = amBoden(punktRef.current);
      if (!letztesZiel || Math.hypot(ziel.x - letztesZiel.x, ziel.y - letztesZiel.y) > 20) {
        k.folge(ziel);
        letztesZiel = ziel;
        gezaehlt = false;
      }
      if (!gezaehlt && !k.laeuft && gesprungen(k.wo(), ziel)) {
        gezaehlt = true;
        setSpruenge((n) => n + 1);
        onSprungRef.current?.();
      }
      const uebrig = Math.max(0, LASER.dauer - (Date.now() - beginn));
      setRest(uebrig);
      if (uebrig === 0) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (rest === 0) onEnde(spruenge); }, [rest, spruenge, onEnde]);

  const bewegen = (e) => { if (flaecheRef.current) setPunkt(inSzene(e, flaecheRef.current)); };
  return (
    <div className="zimmer-spiel" ref={flaecheRef} onPointerMove={bewegen} onPointerDown={bewegen}
         role="application" aria-label="Laserpointer – mit dem Finger den Punkt führen">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg" aria-hidden="true">
        <g transform={`translate(${punkt.x} ${punkt.y})`} data-laser="">
          <circle r="22" fill="#ef4444" opacity="0.25" className="zimmer-laser-schein" />
          <circle r="8" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" />
          <circle r="3" fill="#fecaca" />
        </g>
      </svg>
      <div className="zimmer-spiel-hud">
        <span><strong>{spruenge}</strong> {spruenge === 1 ? 'Sprung' : 'Sprünge'}</span>
        <span className="zimmer-spiel-zeit">{Math.ceil(rest / 1000)} s</span>
        <button className="zimmer-knopf" onClick={() => onEnde(spruenge)}>Fertig</button>
      </div>
    </div>
  );
}
