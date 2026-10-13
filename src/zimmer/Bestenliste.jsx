import { useEffect, useRef, useState } from 'react';
import { KEY_NAME, eintragen, keyFuer, listeLesen, namePutzen, umbenennen } from './bestenliste.js';

const lesen = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const schreiben = (key, wert) => { try { localStorage.setItem(key, wert); } catch { /* gesperrt */ } };

/* Bestenliste eines Spiels lesen – für die Rekord-Anzeige auf der Karte. */
export const bestenliste = (spiel) => listeLesen(lesen(keyFuer(spiel)));

/*
  Endbild mit Bestenliste (2.14.0). Reicht das Ergebnis für die Liste, wird
  es sofort mit dem zuletzt benutzten Namen eingetragen; der Name lässt sich
  direkt im Feld ändern. "Fertig" schliesst das Spiel.
*/
export default function Bestenliste({ spiel, wert, einheit, titel, zusatz, onFertig }) {
  const [stand] = useState(() => {
    const liste = bestenliste(spiel);
    const eintrag = { id: `${Date.now()}`, name: namePutzen(lesen(KEY_NAME)), wert: Math.round(wert), datum: Date.now() };
    const r = eintragen(liste, eintrag);
    if (r.platz) schreiben(keyFuer(spiel), JSON.stringify(r.liste));
    return { ...r, id: eintrag.id, vorher: liste[0]?.wert ?? 0 };
  });
  const [liste, setListe] = useState(stand.liste);
  const [name, setName] = useState(() => lesen(KEY_NAME) ?? '');
  const feldRef = useRef(null);
  useEffect(() => { if (stand.platz && !lesen(KEY_NAME)) feldRef.current?.focus(); }, [stand.platz]);

  const nennen = (roh) => {
    setName(roh);
    const neu = umbenennen(liste, stand.id, roh);
    setListe(neu);
    schreiben(keyFuer(spiel), JSON.stringify(neu));
    schreiben(KEY_NAME, namePutzen(roh));
  };

  const ueberschrift = stand.platz === 1 ? 'Neuer Rekord!' : stand.platz ? `Platz ${stand.platz}!` : titel;
  return (
    <div className="bestenliste" role="dialog" aria-label="Bestenliste" data-bestenliste={spiel} data-platz={stand.platz ?? ''}>
      <h2 className={stand.platz === 1 ? 'rekord' : ''}>{ueberschrift}</h2>
      <p className="bestenliste-wert"><strong>{Math.round(wert)}</strong> {einheit}</p>
      {zusatz && <p className="bestenliste-zusatz">{zusatz}</p>}
      {stand.platz && (
        <label className="bestenliste-name">
          Dein Name
          <input ref={feldRef} value={name} maxLength={14} placeholder="Ich" onChange={(e) => nennen(e.target.value)}
                 onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.currentTarget.blur(); }} />
        </label>
      )}
      <ol className="bestenliste-liste">
        {liste.map((e, k) => (
          <li key={e.id} className={e.id === stand.id ? 'neu' : ''}>
            <span className="platz">{k + 1}.</span>
            <span className="name">{e.name}</span>
            <span className="wert">{e.wert} {einheit}</span>
          </li>
        ))}
        {liste.length === 0 && <li className="leer">Noch kein Eintrag</li>}
      </ol>
      <button className="zimmer-preis" onClick={onFertig}>Fertig</button>
    </div>
  );
}
