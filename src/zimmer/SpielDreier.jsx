import { useEffect, useState } from 'react';
import BrettAnsicht from './reise/BrettAnsicht.jsx';
import useBrettSpiel from './reise/useBrettSpiel.js';
import { leer, startBrett } from './reise/brett.js';
import { FREI } from './reise/frei.js';

/*
  Leckerli-Drei, freies Spiel: 20 Züge auf leerem Brett, so viele Punkte
  wie möglich. Brett und Bedienung teilt es mit der Leckerli-Reise.
*/
export default function SpielDreier({ onEnde }) {
  const [zuege, setZuege] = useState(FREI.zuege);
  const [punkte, setPunkte] = useState(0);
  const spiel = useBrettSpiel(() => startBrett(leer(7), FREI.arten), FREI.arten, (r) => {
    setPunkte((p) => p + r.punkte);
    setZuege((z) => z - 1);
  }, zuege <= 0);

  useEffect(() => {
    if (zuege > 0 || spiel.beschaeftigt) return undefined;
    const t = setTimeout(() => onEnde(punkte), 900);
    return () => clearTimeout(t);
  }, [zuege, spiel.beschaeftigt, punkte, onEnde]);

  return (
    <div className="zimmer-spiel zimmer-spiel-dreier" role="application" aria-label="Leckerli-Drei – drei Gleiche in eine Reihe tauschen">
      <BrettAnsicht spiel={spiel} />
      <div className="zimmer-spiel-hud">
        <span><strong>{punkte}</strong> Punkte</span>
        <span data-dreier-zuege={zuege}>{zuege} {zuege === 1 ? 'Zug' : 'Züge'}</span>
        <button className="zimmer-knopf" onClick={() => onEnde(punkte)}>Fertig</button>
      </div>
    </div>
  );
}
