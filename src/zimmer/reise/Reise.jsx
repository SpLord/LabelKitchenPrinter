import { useCallback, useState } from 'react';
import ReiseKarte from './ReiseKarte.jsx';
import ReiseLevel from './ReiseLevel.jsx';
import { KEY_REISE, LEVEL, ergebnisEintragen, fortschrittLesen } from './level.js';

const lesen = () => { try { return fortschrittLesen(localStorage.getItem(KEY_REISE)); } catch { return fortschrittLesen(null); } };
const schreiben = (f) => { try { localStorage.setItem(KEY_REISE, JSON.stringify(f)); } catch { /* gesperrt */ } };

/*
  Die Leckerli-Reise (2.13.0): Karte mit dreissig Leveln in drei Welten.
  Fortschritt (Sterne, Rekorde) liegt im Browser; Münzen gehen über onLohn
  an das Zimmer – nur fürs erste Schaffen und neue Sterne.
*/
export default function Reise({ fell, onLohn, onZu }) {
  const [fortschritt, setFortschritt] = useState(lesen);
  const [ansicht, setAnsicht] = useState({ art: 'karte' });

  const eintragen = useCallback((nr, sterne, punkte) => {
    const aktuell = lesen();
    const { lohn, fortschritt: neu } = ergebnisEintragen(aktuell, nr, sterne, punkte);
    schreiben(neu);
    setFortschritt(neu);
    if (lohn > 0) onLohn(lohn);
    return lohn;
  }, [onLohn]);

  if (ansicht.art === 'level') {
    const level = LEVEL[ansicht.nr - 1];
    const naechstes = LEVEL[ansicht.nr];
    return (
      <div className="zimmer-spiel reise" role="application" aria-label={`Leckerli-Reise, Level ${level.nr}`}>
        <ReiseLevel
          key={`${level.nr}-${ansicht.runde}`}
          level={level}
          rekord={fortschritt.rekord[level.nr] ?? 0}
          besteSterne={fortschritt.sterne[level.nr] ?? 0}
          onErgebnis={(sterne, punkte) => eintragen(level.nr, sterne, punkte)}
          onKarte={() => setAnsicht({ art: 'karte' })}
          onNochmal={() => setAnsicht({ art: 'level', nr: level.nr, runde: (ansicht.runde ?? 0) + 1 })}
          onWeiter={naechstes ? () => setAnsicht({ art: 'level', nr: naechstes.nr, runde: 0 }) : null}
        />
      </div>
    );
  }
  return (
    <div className="zimmer-spiel reise" role="application" aria-label="Leckerli-Reise – Karte">
      <ReiseKarte fortschritt={fortschritt} fell={fell} onLevel={(nr) => setAnsicht({ art: 'level', nr, runde: 0 })} onZu={onZu} />
    </div>
  );
}
