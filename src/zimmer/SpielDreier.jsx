import { useEffect, useState } from 'react';
import BrettAnsicht, { PfotenKnopf } from './reise/BrettAnsicht.jsx';
import useBrettSpiel from './reise/useBrettSpiel.js';
import { leer, startBrett } from './reise/brett.js';
import { FREI, freiLohn } from './reise/frei.js';
import Bestenliste from './Bestenliste.jsx';

/*
  Leckerli-Drei, freies Spiel: 20 Züge auf leerem Brett, so viele Punkte
  wie möglich. Brett und Bedienung teilt es mit der Leckerli-Reise.
*/
export default function SpielDreier({ onEnde }) {
  const [zuege, setZuege] = useState(FREI.zuege);
  const [punkte, setPunkte] = useState(0);
  // Endbild mit Bestenliste: wenn die Züge aus sind oder auf "Fertig"
  const [schluss, setSchluss] = useState(false);
  const spiel = useBrettSpiel(() => startBrett(leer(7), FREI.arten), FREI.arten, (r, _s, { ohneZug }) => {
    setPunkte((p) => p + r.punkte);
    if (!ohneZug) setZuege((z) => z - 1);
  }, zuege <= 0 || schluss);

  useEffect(() => {
    if (zuege > 0 || spiel.beschaeftigt) return undefined;
    const t = setTimeout(() => setSchluss(true), 900);
    return () => clearTimeout(t);
  }, [zuege, spiel.beschaeftigt]);

  return (
    <div className="zimmer-spiel zimmer-spiel-dreier" role="application" aria-label="Leckerli-Drei – drei Gleiche in eine Reihe tauschen">
      <BrettAnsicht spiel={spiel} />
      {schluss && (
        <div className="zimmer-spiel-schluss">
          <Bestenliste spiel="dreier" wert={punkte} einheit="Punkte" titel="Keine Züge mehr"
                       zusatz={`+${freiLohn(punkte)} Münzen`} onFertig={() => onEnde(punkte)} />
        </div>
      )}
      <div className="zimmer-spiel-hud">
        <span><strong>{punkte}</strong> Punkte</span>
        <span data-dreier-zuege={zuege}>{zuege} {zuege === 1 ? 'Zug' : 'Züge'}</span>
        <PfotenKnopf spiel={spiel} />
        <button className="zimmer-knopf" disabled={spiel.beschaeftigt} onClick={() => setSchluss(true)}>Fertig</button>
      </div>
    </div>
  );
}
