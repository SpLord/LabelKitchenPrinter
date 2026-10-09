import { useEffect, useState } from 'react';
import CatVariant from '../cat/CatVariant.jsx';
import { VERSTECK, VERSTECKE, versteckWahl } from './spiele2.js';

const K = { stroke: '#2f2a26', strokeLinejoin: 'round', strokeLinecap: 'round' };

/* Die vier Verstecke, jeweils um ihren Fusspunkt gezeichnet. */
const VERSTECK_BILD = {
  kiste: <g {...K} strokeWidth="5"><path d="M-60 0 v-80 h120 v80 Z" fill="#d6a15d" /><path d="M-60 -80 l-14 -22 h120 l14 22" fill="#e7c08a" /><path d="M-30 -40 h60" strokeWidth="4" /></g>,
  vorhang: <g {...K} strokeWidth="5"><path d="M-60 -170 h120" strokeWidth="7" /><path d="M-56 -170 q-6 85 4 170 h104 q10 -85 4 -170 Z" fill="#c4b5fd" /><path d="M-20 -165 q-4 80 2 160 M20 -165 q4 80 -2 160" fill="none" strokeWidth="3" /></g>,
  korb: <g {...K} strokeWidth="5"><path d="M-62 -60 q62 -24 124 0 l-10 60 h-104 Z" fill="#b45309" /><path d="M-50 -40 h100 M-46 -20 h92" strokeWidth="3" fill="none" /><path d="M-40 -66 q40 -46 80 0" fill="none" strokeWidth="6" /></g>,
  pflanze: <g {...K} strokeWidth="5"><path d="M-30 0 l-6 -44 h72 l-6 44 Z" fill="#c2410c" /><g fill="#22c55e"><path d="M0 -44 q-60 -40 -40 -110 q30 40 40 110 Z" /><path d="M0 -44 q60 -40 40 -110 q-30 40 -40 110 Z" /><path d="M0 -44 q-8 -70 0 -130 q8 60 0 130 Z" /></g></g>,
};

/*
  Versteckspiel (2.8.0): Die Katze versteckt sich hinter einem von vier
  Dingen. Nach ein paar Sekunden schaut ihr Schwanz hervor. Antippen: richtig
  heisst gefunden (Münzen, wenn beim ersten Versuch), falsch wackelt nur.
*/
export default function SpielVersteck({ fell, onEnde }) {
  const [runde, setRunde] = useState(1);
  const [wo, setWo] = useState(() => versteckWahl(-1));
  const [schwanz, setSchwanz] = useState(false);
  const [fehlversuch, setFehlversuch] = useState(false);
  const [wackelt, setWackelt] = useState(null);
  const [gefunden, setGefunden] = useState(false);
  const [funde, setFunde] = useState(0);

  useEffect(() => {
    setSchwanz(false);
    const t = setTimeout(() => setSchwanz(true), VERSTECK.schwanzNach);
    return () => clearTimeout(t);
  }, [runde]);

  const tippen = (i) => {
    if (gefunden) return;
    if (i !== wo) {
      setFehlversuch(true);
      setWackelt({ i, id: Date.now() });
      return;
    }
    const mitLohn = !fehlversuch;
    const neu = funde + (mitLohn ? 1 : 0);
    setFunde(neu);
    setGefunden(true);
    setTimeout(() => {
      if (runde >= VERSTECK.runden) { onEnde(neu); return; }
      setRunde((r) => r + 1);
      setWo((alt) => versteckWahl(alt));
      setFehlversuch(false);
      setGefunden(false);
    }, 1100);
  };

  return (
    <div className="zimmer-spiel zimmer-spiel-versteck" role="application" aria-label="Versteckspiel – wo ist die Katze?">
      <svg viewBox="0 0 1024 768" className="zimmer-spiel-svg">
        {VERSTECKE.map((v, i) => (
          <g key={v.id} transform={`translate(${v.x} ${v.y})`}>
            {/* Hinter dem Versteck: Schwanz als Hinweis, beim Fund der Kopf */}
            {i === wo && schwanz && !gefunden && (
              <path className="zimmer-versteck-schwanz" d="M48 -14 q34 -10 30 -44" fill="none" stroke="#2f2a26" strokeWidth="9" strokeLinecap="round" />
            )}
            {i === wo && gefunden && (
              <svg x="-55" y="-150" width="110" height="110" viewBox="0 0 200 200" className="zimmer-versteck-katze" overflow="visible">
                <CatVariant index={fell} active zubehoer={{}} />
              </svg>
            )}
            <g key={wackelt?.i === i ? wackelt.id : 'ruhig'} className={wackelt?.i === i ? 'zimmer-wackeln' : undefined}
               onPointerDown={() => tippen(i)} role="button" aria-label={`Versteck ${i + 1}`} data-versteck={v.id}
               style={{ cursor: 'pointer' }}>
              {VERSTECK_BILD[v.id]}
              <rect x="-75" y="-180" width="150" height="190" fill="transparent" />
            </g>
          </g>
        ))}
      </svg>
      <div className="zimmer-spiel-hud">
        <span>Runde <strong>{runde}</strong> / {VERSTECK.runden}</span>
        <span><strong>{funde}</strong> gefunden</span>
        <button className="zimmer-knopf" onClick={() => onEnde(funde)}>Fertig</button>
      </div>
    </div>
  );
}
