import { useEffect, useRef, useState } from 'react';
import { inSzene } from './SpielFederangel.jsx';
import { WOLLE, angekommen, wurfZiel } from './spiele3.js';

/* Wollknäuel, gezeichnet: Kugel mit Fadenwindungen und loser Fadenschlaufe. */
const Knaeuel = () => (
  <g stroke="#2f2a26" strokeLinecap="round" strokeLinejoin="round">
    <circle r="20" fill="#f472b6" strokeWidth="4" />
    <g fill="none" strokeWidth="2.5" stroke="#9d174d">
      <path d="M-16 -8 q16 10 32 0" /><path d="M-18 4 q18 10 36 0" /><path d="M-8 -18 q-6 18 4 36" />
    </g>
    <path d="M16 12 q14 6 22 -2" fill="none" stroke="#f472b6" strokeWidth="3.5" />
  </g>
);

/*
  Apportieren (2.10.0): Auf den Boden tippen wirft das Wollknäuel dorthin.
  Sie rennt hin, nimmt es ins Maul und bringt es zurück nach vorn. Jedes
  zurückgebrachte Knäuel bringt Laune.

  Das Knäuel im Maul folgt ihr mit demselben CSS-Übergang wie die Katze,
  damit es nicht hinterherhinkt.
*/
export default function SpielWolle({ katze, onGebracht, onEnde }) {
  const flaecheRef = useRef(null);
  const [phase, setPhase] = useState('bereit');      // bereit | fliegt | holt | bringt
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [wolle, setWolle] = useState(WOLLE.heim);
  const zielRef = useRef(WOLLE.heim);
  const [gebracht, setGebracht] = useState(0);
  const [rest, setRest] = useState(WOLLE.dauer);
  const katzeRef = useRef(katze);
  katzeRef.current = katze;
  const onGebrachtRef = useRef(onGebracht);
  onGebrachtRef.current = onGebracht;

  useEffect(() => {
    const beginn = Date.now();
    const id = setInterval(() => {
      const k = katzeRef.current;
      const p = phaseRef.current;
      if (p === 'holt' && !k.laeuft && angekommen(k.wo(), zielRef.current)) {
        setPhase('bringt');
        k.folge({ x: WOLLE.heim.x + 60, y: WOLLE.heim.y - 20 });
      } else if (p === 'bringt' && !k.laeuft && angekommen(k.wo(), { x: WOLLE.heim.x + 60, y: WOLLE.heim.y - 20 })) {
        setWolle(WOLLE.heim);
        setPhase('bereit');
        setGebracht((n) => n + 1);
        onGebrachtRef.current?.();
      }
      const uebrig = Math.max(0, WOLLE.dauer - (Date.now() - beginn));
      setRest(uebrig);
      if (uebrig === 0) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (rest === 0) onEnde(gebracht); }, [rest, gebracht, onEnde]);

  // Nach dem Flug rennt sie los
  useEffect(() => {
    if (phase !== 'fliegt') return undefined;
    const t = setTimeout(() => { setPhase('holt'); katzeRef.current.folge(zielRef.current); }, WOLLE.flug);
    return () => clearTimeout(t);
  }, [phase]);

  const werfen = (e) => {
    if (phaseRef.current !== 'bereit' || !flaecheRef.current) return;
    const ziel = wurfZiel(inSzene(e, flaecheRef.current));
    zielRef.current = ziel;
    setWolle(ziel);
    setPhase('fliegt');
  };

  // Im Maul: vor ihrem Kopf, Blickrichtung beachten (gezeichnet schaut sie nach links)
  const imMaul = phase === 'bringt';
  const ort = imMaul ? { x: katze.pos.x + katze.richtung * 52, y: katze.pos.y - 52 } : wolle;
  const uebergang = imMaul ? `transform ${katze.dauer}ms cubic-bezier(.3,.08,.5,1)` : `transform ${WOLLE.flug}ms cubic-bezier(.2,.6,.4,1)`;
  return (
    <div className="zimmer-spiel" ref={flaecheRef} onPointerDown={werfen}
         role="application" aria-label="Apportieren – auf den Boden tippen wirft das Wollknäuel">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg" aria-hidden="true">
        <g style={{ transform: `translate(${ort.x}px, ${ort.y}px)`, transition: uebergang }} data-wolle={phase}>
          <g className={phase === 'fliegt' ? 'zimmer-wolle-fliegt' : undefined} style={{ animationDuration: `${WOLLE.flug}ms` }}>
            <g transform={imMaul ? 'scale(0.75)' : undefined}><Knaeuel /></g>
          </g>
        </g>
      </svg>
      <div className="zimmer-spiel-hud">
        <span><strong>{gebracht}</strong>-mal gebracht</span>
        <span className="zimmer-spiel-zeit">{Math.ceil(rest / 1000)} s</span>
        <button className="zimmer-knopf" onPointerDown={(e) => e.stopPropagation()} onClick={() => onEnde(gebracht)}>Fertig</button>
      </div>
    </div>
  );
}
