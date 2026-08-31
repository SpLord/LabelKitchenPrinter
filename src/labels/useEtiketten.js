import { useCallback, useEffect, useRef, useState } from 'react';
import { loadGroups, saveGroups } from './store.js';
import { ablegen, holen } from './fernspeicher.js';

/*
  Etikettenliste, lokal und gemeinsam.

  Reihenfolge beim Start: erst der lokale Stand, damit sofort etwas dasteht,
  dann der Server. Ist er erreichbar, gewinnt er – so sehen alle Geräte
  dasselbe. Ist er es nicht, arbeitet die Küche mit dem lokalen Stand weiter.

  Beim Speichern umgekehrt: erst lokal (sofort, kann nicht scheitern), dann
  zum Server. Schlägt das fehl, bleibt die Änderung trotzdem auf dem Gerät und
  der Zustand sagt es ehrlich.

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

  // Einmal beim Start mit dem Server abgleichen
  useEffect(() => {
    let abgebrochen = false;

    (async () => {
      const antwort = await holen();
      if (abgebrochen) return;

      if (antwort.zustand === 'gefunden') {
        setGroups(antwort.groups);
        saveGroups(antwort.groups);
        setZustand('geteilt');
        return;
      }

      if (antwort.zustand === 'leer') {
        // Erstes Gerät: der lokale Stand wird zum gemeinsamen
        const start = loadGroups();
        const ergebnis = await ablegen(start);
        if (abgebrochen) return;
        setZustand(ergebnis.ok ? 'geteilt' : 'nurLokal');
        return;
      }

      setZustand('nurLokal');
    })();

    return () => { abgebrochen = true; };
  }, []);

  const aendern = useCallback(async (naechste) => {
    setGroups(naechste);
    if (!saveGroups(naechste)) meldeRef.current?.('Etiketten konnten lokal nicht gespeichert werden.');

    const ergebnis = await ablegen(naechste);
    setZustand(ergebnis.ok ? 'geteilt' : 'nurLokal');
    if (!ergebnis.ok) {
      meldeRef.current?.(`Nur auf diesem Gerät gespeichert (${ergebnis.grund}).`);
    }
  }, []);

  return { groups, zustand, aendern };
}
