import { useEffect, useRef, useState } from 'react';
import { BLASEN, amBoden, blaseHoehe, blaseNeu, blaseWeg } from './spiele3.js';

/*
  Seifenblasen (2.10.0): Blasen steigen vom Boden auf. Antippen lässt sie
  platzen – und die Katze springt zur Stelle darunter. Bringt Laune.

  Das Aufsteigen ist eine CSS-Animation (--steigen); wo die Blase beim Tipp
  gerade ist, rechnet blaseHoehe aus der Startzeit nach.
*/
export default function SpielBlasen({ katze, onPlatzt, onEnde }) {
  const [blasen, setBlasen] = useState([]);
  const [platzer, setPlatzer] = useState([]);
  const [anzahl, setAnzahl] = useState(0);
  const [rest, setRest] = useState(BLASEN.dauer);
  const katzeRef = useRef(katze);
  katzeRef.current = katze;

  useEffect(() => {
    const beginn = Date.now();
    let id = 0;
    const neu = setInterval(() => {
      const jetzt = Date.now();
      id += 1;
      setBlasen((b) => [...b.filter((x) => !blaseWeg(x, jetzt)), blaseNeu(id, jetzt)]);
    }, BLASEN.abstand);
    const uhr = setInterval(() => setRest(Math.max(0, BLASEN.dauer - (Date.now() - beginn))), 250);
    return () => { clearInterval(neu); clearInterval(uhr); };
  }, []);

  useEffect(() => { if (rest === 0) onEnde(anzahl); }, [rest, anzahl, onEnde]);
  useEffect(() => {
    if (platzer.length === 0) return undefined;
    const t = setTimeout(() => setPlatzer((p) => p.slice(1)), 450);
    return () => clearTimeout(t);
  }, [platzer]);

  const platzen = (b) => {
    const y = blaseHoehe(b, Date.now());
    setBlasen((alt) => alt.filter((x) => x.id !== b.id));
    setPlatzer((p) => [...p.slice(-4), { id: b.id, x: b.x, y, r: b.r }]);
    setAnzahl((n) => n + 1);
    katzeRef.current.folge(amBoden({ x: b.x, y: 640 }));
    onPlatzt?.();
  };

  return (
    <div className="zimmer-spiel zimmer-spiel-blasen" role="application" aria-label="Seifenblasen – antippen lässt sie platzen">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg">
        {blasen.map((b) => (
          <g key={b.id} transform={`translate(${b.x} ${BLASEN.start})`}>
            <g className="zimmer-blase-steigt" style={{ '--steigen': `${BLASEN.ende - BLASEN.start}px`, animationDuration: `${b.dauer}ms` }}>
              <g className="zimmer-blase-wabert" onPointerDown={() => platzen(b)} role="button" aria-label="Seifenblase" data-blase={b.id}>
                <circle r={b.r} fill="#e0f2fe" fillOpacity="0.35" stroke="#7dd3fc" strokeWidth="3" />
                <path d={`M${-b.r * 0.5} ${-b.r * 0.35} a${b.r * 0.6} ${b.r * 0.6} 0 0 1 ${b.r * 0.45} ${-b.r * 0.3}`} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                <circle r={b.r + 10} fill="transparent" />
              </g>
            </g>
          </g>
        ))}
        {platzer.map((p) => (
          <g key={p.id} transform={`translate(${p.x} ${p.y})`} pointerEvents="none" data-geplatzt="">
            <g className="zimmer-blase-platzt">
              {[0, 60, 120, 180, 240, 300].map((w) => (
                <circle key={w} r="4" fill="#7dd3fc" transform={`rotate(${w}) translate(${p.r} 0)`} />
              ))}
            </g>
          </g>
        ))}
      </svg>
      <div className="zimmer-spiel-hud">
        <span><strong>{anzahl}</strong> geplatzt</span>
        <span className="zimmer-spiel-zeit">{Math.ceil(rest / 1000)} s</span>
        <button className="zimmer-knopf" onClick={() => onEnde(anzahl)}>Fertig</button>
      </div>
    </div>
  );
}
