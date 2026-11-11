import { useCallback, useEffect, useRef, useState } from 'react';
import { loadGroups, saveGroups } from './store.js';
import { ablegen, holen, startAbgleich } from './fernspeicher.js';

// '1', solange eine Änderung auf diesem Gerät den Server nicht erreicht hat
const KEY_UNGESICHERT = 'etikett_ungesichert';
const ungesichertLesen = () => { try { return localStorage.getItem(KEY_UNGESICHERT) === '1'; } catch { return false; } };
const ungesichertSetzen = (ja) => {
  try { if (ja) localStorage.setItem(KEY_UNGESICHERT, '1'); else localStorage.removeItem(KEY_UNGESICHERT); } catch { /* gesperrt */ }
};

/*
  Etikettenliste, lokal und gemeinsam.

  Reihenfolge beim Start: erst der lokale Stand, damit sofort etwas dasteht,
  dann der Server. Ist er erreichbar, gewinnt er – so sehen alle Geräte
  dasselbe. Ist er es nicht, arbeitet die Küche mit dem lokalen Stand weiter.

  Beim Speichern umgekehrt: erst lokal (sofort, kann nicht scheitern), dann
  zum Server. Schlägt das fehl, bleibt die Änderung trotzdem auf dem Gerät und
  der Zustand sagt es ehrlich.

  Ausnahme (2.15.1): Hat eine Änderung den Server nie erreicht, gewinnt beim
  nächsten Start das Gerät und legt sie nach – vorher war sie still weg.

  Kein "letzter gewinnt"-Schutz: bei einem Tablet unnötig, bei mehreren
  gleichzeitigen Bearbeitern ginge eine Änderung verloren. Das wäre der
  Zeitpunkt für einen echten Dienst.
*/
export default function useEtiketten(melde) {
  const [groups, setGroups] = useState(loadGroups);
  // 'lokal' | 'geteilt' | 'nurLokal'
  const [zustand, setZustand] = useState('lokal');
  const meldeRef = useRef(melde);
  meldeRef.current = melde;

  // Wurde schon bearbeitet, bevor der Start-Abgleich fertig war?
  const geaendertRef = useRef(false);

  // Einmal beim Start mit dem Server abgleichen
  useEffect(() => {
    let abgebrochen = false;

    (async () => {
      const antwort = await holen();
      if (abgebrochen) return;

      const schritt = startAbgleich(antwort, { ungesichert: ungesichertLesen(), geaendert: geaendertRef.current });
      if (schritt === 'uebernehmen') {
        setGroups(antwort.groups);
        saveGroups(antwort.groups);
        setZustand('geteilt');
        return;
      }
      if (schritt === 'hochladen') {
        // Erstes Gerät oder offline Geändertes: der lokale Stand wird zum gemeinsamen
        const ergebnis = await ablegen(loadGroups());
        if (abgebrochen) return;
        ungesichertSetzen(!ergebnis.ok);
        setZustand(ergebnis.ok ? 'geteilt' : 'nurLokal');
        return;
      }
      if (schritt === 'lokal') setZustand('nurLokal');
      // 'behalten': die laufende Bearbeitung legt selbst ab
    })();

    return () => { abgebrochen = true; };
  }, []);

  /*
    Ablegen der Reihe nach: zwei schnelle Änderungen schickten sonst zwei PUTs
    gleichzeitig, und kam der ältere zuletzt an, lag der alte Stand auf dem
    Server. Jeder Auftrag wartet auf den vorigen.
  */
  const reiheRef = useRef(Promise.resolve());
  const aendern = useCallback(async (naechste) => {
    geaendertRef.current = true;
    setGroups(naechste);
    if (!saveGroups(naechste)) meldeRef.current?.('Etiketten konnten lokal nicht gespeichert werden.');

    const auftrag = reiheRef.current.then(() => ablegen(naechste));
    reiheRef.current = auftrag.catch(() => {});
    const ergebnis = await auftrag;
    ungesichertSetzen(!ergebnis.ok);
    setZustand(ergebnis.ok ? 'geteilt' : 'nurLokal');
    if (!ergebnis.ok) {
      meldeRef.current?.(`Nur auf diesem Gerät gespeichert (${ergebnis.grund}).`);
    }
  }, []);

  return { groups, zustand, aendern };
}
