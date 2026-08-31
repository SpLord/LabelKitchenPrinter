import { useCallback, useEffect, useMemo, useState } from 'react';
import { catchUp, clampNeed, conditionOf, decayOver, feed } from './needs.js';

const KEY_HUNGER = 'cat_hunger';
const KEY_THIRST = 'cat_thirst';
const KEY_SEEN = 'cat_lastSeen';
const START = 80;
const TAKT = 60000; // eine Minute

const lesen = (key) => {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? clampNeed(v) : START;
  } catch {
    return START;
  }
};

const schreiben = (key, wert) => {
  try { localStorage.setItem(key, String(wert)); } catch { /* Speicher nicht verfügbar */ }
};

/*
  Hunger und Durst der Katze.

  Der Verfall hängt an der echten Uhr, nicht an Intervall-Ticks: ein
  geschlossener Tab hielt die Werte sonst künstlich hoch. Zeit ohne die Seite
  wird beim Laden nachgeholt, aber gedeckelt – sonst wäre die Katze nach jedem
  Wochenende völlig ausgehungert.

  Die Rechenregeln liegen in needs.js und sind dort getestet.
*/
export default function useCatNeeds() {
  const [hunger, setHunger] = useState(() => lesen(KEY_HUNGER));
  const [thirst, setThirst] = useState(() => lesen(KEY_THIRST));

  useEffect(() => { schreiben(KEY_HUNGER, hunger); }, [hunger]);
  useEffect(() => { schreiben(KEY_THIRST, thirst); }, [thirst]);

  useEffect(() => {
    const stempeln = () => schreiben(KEY_SEEN, Date.now());

    try {
      const lastSeen = Number(localStorage.getItem(KEY_SEEN));
      if (Number.isFinite(lastSeen) && lastSeen > 0) {
        setHunger((h) => catchUp({ hunger: h, thirst: 100, lastSeen }).hunger);
        setThirst((t) => catchUp({ hunger: 100, thirst: t, lastSeen }).thirst);
      }
    } catch { /* ohne Zeitstempel beginnt der Verfall einfach jetzt */ }
    stempeln();

    const id = setInterval(() => {
      setHunger((v) => decayOver(v, TAKT));
      setThirst((v) => decayOver(v, TAKT));
      stempeln();
    }, TAKT);

    return () => { clearInterval(id); stempeln(); };
  }, []);

  // Stabile Referenzen: sonst startet jede Effektschleife, die sie als
  // Abhängigkeit führt, bei jedem Render neu.
  const fuettern = useCallback((menge) => setHunger((v) => feed(v, menge)), []);
  const traenken = useCallback((menge) => setThirst((v) => feed(v, menge)), []);

  return useMemo(
    () => ({ hunger, thirst, zustand: conditionOf(hunger, thirst), fuettern, traenken }),
    [hunger, thirst, fuettern, traenken],
  );
}
