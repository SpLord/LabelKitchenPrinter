import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { catchUp, clampNeed, decayOver, feed } from './needs.js';
import {
  KRANK_SCHWELLE, MEDIZIN_FUELLT, VERFALL_FAKTOR_SCHLAF,
  freudeVerfall, gesamtzustand, schlaeft, wirdKrank,
} from './tamagotchi.js';

const KEY_HUNGER = 'cat_hunger';
const KEY_THIRST = 'cat_thirst';
const KEY_FREUDE = 'cat_freude';
const KEY_KRANK = 'cat_krank';
const KEY_NOT_SEIT = 'cat_notSeit';
const KEY_SEEN = 'cat_lastSeen';
const START = 80;
const TAKT = 60000; // eine Minute

const lesen = (key) => {
  try {
    const roh = localStorage.getItem(key);
    // Fehlt der Schlüssel, liefert getItem null – und Number(null) ist 0.
    // Ohne diese Prüfung startete die Katze auf einem frischen Gerät bei 0 %,
    // also sofort ausgehungert.
    if (roh === null || roh.trim() === '') return START;
    const v = Number(roh);
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
const OHNE_WIRKUNG = { hungerFaktor: 1, durstFaktor: 1, freudeFaktor: 1, schlafErholung: false };

/* Erholung im Schlaf, wenn die Kuschelhöhle gekauft ist – Punkte je Stunde. */
export const SCHLAF_ERHOLUNG_PRO_STUNDE = 4;

export default function useCatNeeds(haeufchen = 0, wirkung = OHNE_WIRKUNG) {
  const { hungerFaktor, durstFaktor, freudeFaktor, schlafErholung } = { ...OHNE_WIRKUNG, ...wirkung };
  /*
    Über Refs, nicht über Abhängigkeiten: hinge der Nachhol-Effekt an den
    Faktoren, liefe er beim Kauf eines Futterautomaten erneut und würde die
    Abwesenheit ein zweites Mal abziehen. Der Wert darf sich ändern, der
    Effekt nicht neu starten.
  */
  const bremseRef = useRef({ hungerFaktor, durstFaktor });
  bremseRef.current = { hungerFaktor, durstFaktor };
  const [hunger, setHunger] = useState(() => lesen(KEY_HUNGER));
  const [thirst, setThirst] = useState(() => lesen(KEY_THIRST));
  const [freude, setFreude] = useState(() => lesen(KEY_FREUDE));
  const [krank, setKrank] = useState(() => {
    try { return localStorage.getItem(KEY_KRANK) === '1'; } catch { return false; }
  });
  // Seit wann ist etwas im Argen? Grundlage für die Krankheit.
  const notSeitRef = useRef(null);

  useEffect(() => { schreiben(KEY_HUNGER, hunger); }, [hunger]);
  useEffect(() => { schreiben(KEY_THIRST, thirst); }, [thirst]);
  useEffect(() => { schreiben(KEY_FREUDE, freude); }, [freude]);
  useEffect(() => {
    try { localStorage.setItem(KEY_KRANK, krank ? '1' : '0'); } catch { /* gesperrt */ }
  }, [krank]);

  useEffect(() => {
    try {
      const roh = Number(localStorage.getItem(KEY_NOT_SEIT));
      notSeitRef.current = Number.isFinite(roh) && roh > 0 ? roh : null;
    } catch { /* gesperrt */ }
  }, []);

  useEffect(() => {
    const stempeln = () => schreiben(KEY_SEEN, Date.now());

    try {
      const lastSeen = Number(localStorage.getItem(KEY_SEEN));
      if (Number.isFinite(lastSeen) && lastSeen > 0) {
        const { hungerFaktor: hf, durstFaktor: df } = bremseRef.current;
        setHunger((h) => catchUp({ hunger: h, thirst: 100, lastSeen, hungerFaktor: hf }).hunger);
        setThirst((t) => catchUp({ hunger: 100, thirst: t, lastSeen, durstFaktor: df }).thirst);
      }
    } catch { /* ohne Zeitstempel beginnt der Verfall einfach jetzt */ }
    stempeln();

    const id = setInterval(() => {
      // Nachts ruht sie: halber Verfall statt Pflegefehler wie im Original.
      const takt = schlaeft() ? TAKT * VERFALL_FAKTOR_SCHLAF : TAKT;
      // Gekaufte Ausstattung bremst den Verfall. Der Faktor sitzt an der
      // Zeitspanne, weil decayOver linear darin ist – so gilt dieselbe Regel
      // hier wie beim Nachholen der Abwesenheit.
      setHunger((v) => decayOver(v, takt * bremseRef.current.hungerFaktor));
      setThirst((v) => decayOver(v, takt * bremseRef.current.durstFaktor));
      stempeln();
    }, TAKT);

    return () => { clearInterval(id); stempeln(); };
  }, []);

  // Stabile Referenzen: sonst startet jede Effektschleife, die sie als
  // Abhängigkeit führt, bei jedem Render neu.
  const fuettern = useCallback((menge) => setHunger((v) => feed(v, menge)), []);
  const traenken = useCallback((menge) => setThirst((v) => feed(v, menge)), []);

  // Zufriedenheit fällt eigenständig, schneller wenn etwas fehlt oder Dreck liegt
  useEffect(() => {
    const id = setInterval(() => {
      // Mit Kuschelhöhle ist die Nacht Erholung statt Abbau – der einzige
      // Zeitraum, in dem die Zufriedenheit von allein steigt.
      if (schlaeft() && schlafErholung) {
        setFreude((v) => clampNeed(v + SCHLAF_ERHOLUNG_PRO_STUNDE / 60));
        return;
      }
      const rate = freudeVerfall({ hunger, thirst, haeufchen }) * freudeFaktor;
      const verlust = (schlaeft() ? VERFALL_FAKTOR_SCHLAF : 1) * (rate / 60);
      setFreude((v) => clampNeed(v - verlust));
    }, TAKT);
    return () => clearInterval(id);
  }, [hunger, thirst, haeufchen, freudeFaktor, schlafErholung]);

  // Krank wird sie nur nach anhaltender Not – nie zufällig, nie tödlich.
  useEffect(() => {
    const inNot = Math.min(clampNeed(hunger), clampNeed(thirst)) < KRANK_SCHWELLE;
    if (!inNot) {
      notSeitRef.current = null;
      try { localStorage.removeItem(KEY_NOT_SEIT); } catch { /* gesperrt */ }
      return;
    }
    if (!notSeitRef.current) {
      notSeitRef.current = Date.now();
      schreiben(KEY_NOT_SEIT, notSeitRef.current);
    }
    if (wirdKrank({ hunger, thirst, notSeit: notSeitRef.current, krank })) setKrank(true);
  }, [hunger, thirst, krank]);

  const erfreuen = useCallback((menge) => setFreude((v) => feed(v, menge)), []);

  const heilen = useCallback(() => {
    setKrank(false);
    notSeitRef.current = null;
    try { localStorage.removeItem(KEY_NOT_SEIT); } catch { /* gesperrt */ }
    setHunger((v) => feed(v, MEDIZIN_FUELLT));
    setThirst((v) => feed(v, MEDIZIN_FUELLT));
  }, []);

  return useMemo(
    () => ({
      hunger, thirst, freude, krank,
      zustand: gesamtzustand({ hunger, thirst, freude, krank }),
      schlaeft: schlaeft(),
      fuettern, traenken, erfreuen, heilen,
    }),
    [hunger, thirst, freude, krank, fuettern, traenken, erfreuen, heilen],
  );
}
