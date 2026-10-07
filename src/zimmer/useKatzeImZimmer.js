import { useCallback, useEffect, useRef, useState } from 'react';
import { ORTE, naechsteTaetigkeit, wegDauer } from './verhalten.js';

/* Beim Spielen rennt sie – doppelt so schnell wie beim Bummeln. */
const JAGDTEMPO = 320;
/* Höhenunterschied ab dem sie springt statt läuft (Regal, 2.4.0). */
const SPRUNG_AB = 150;
const SPRUNG_DAUER = 800;
const jagdDauer = (von, nach) =>
  Math.max(220, Math.round((Math.hypot(nach.x - von.x, nach.y - von.y) / JAGDTEMPO) * 1000));

/*
  Taktgeber der Katze im Zimmer.

  Ein Durchgang: entscheiden (verhalten.js) → hinlaufen → Tätigkeit ausführen
  → Wirkung anwenden → von vorn. Der Lauf selbst ist ein CSS-Übergang; hier
  wird nur gesetzt, WOHIN und WIE LANGE.

  Für Spiele lässt sie sich von aussen führen: folge(ort) unterbricht den
  Tagesablauf und lässt sie dorthin rennen, freigeben() lässt sie weiter-
  machen wie vorher.

  lageRef und anwendenRef sind Refs, damit dieser Ablauf genau einmal startet.
  Hinge er an den Bedürfnissen, würde er bei jeder Änderung neu beginnen –
  derselbe Fehler, der den Zufriedenheitsverfall monatelang lahmgelegt hat.
*/
export default function useKatzeImZimmer(lageRef, anwendenRef) {
  const start = { ...ORTE.liegen, x: 720 };
  const posRef = useRef(start);
  const uhrRef = useRef(null);
  const ausRef = useRef(false);
  const gefuehrtRef = useRef(false);
  const durchgangRef = useRef(null);
  const [katze, setKatze] = useState({
    pos: start, richtung: -1, dauer: 0, laeuft: false, art: 'sitzen', blase: null, springt: false,
  });

  const warte = useCallback((ms, f) => {
    clearTimeout(uhrRef.current);
    uhrRef.current = setTimeout(() => { if (!ausRef.current) f(); }, ms);
  }, []);

  useEffect(() => {
    ausRef.current = false;
    const durchgang = () => {
      if (gefuehrtRef.current) return;
      const t = naechsteTaetigkeit(lageRef.current);
      const von = posRef.current;
      const nach = t.ort ?? von;
      // Hinauf aufs Regal oder herunter: ein Sprung im Bogen statt schräg zu gleiten
      const springt = Boolean(t.ort) && Math.abs(nach.y - von.y) > SPRUNG_AB;
      const weg = !t.ort ? 0 : springt ? SPRUNG_DAUER : wegDauer(von, nach);
      const richtungUnterwegs = nach.x < von.x - 2 ? -1 : nach.x > von.x + 2 ? 1 : (von.richtung ?? -1);
      posRef.current = { x: nach.x, y: nach.y, richtung: nach.richtung ?? richtungUnterwegs };

      setKatze({ pos: { x: nach.x, y: nach.y }, richtung: richtungUnterwegs, dauer: weg, laeuft: weg > 0, art: t.art, blase: t.blase, springt });

      // Angekommen: zum Ziel hin ausrichten, dann die Tätigkeit
      warte(weg, () => {
        setKatze((k) => ({ ...k, laeuft: false, dauer: 0, springt: false, richtung: nach.richtung ?? k.richtung }));
        warte(t.dauer, () => {
          anwendenRef.current?.(t.art, nach);
          setKatze((k) => ({ ...k, blase: null }));
          warte(400, durchgang);
        });
      });
    };
    durchgangRef.current = durchgang;
    warte(900, durchgang);
    return () => { ausRef.current = true; clearTimeout(uhrRef.current); };
  }, [lageRef, anwendenRef, warte]);

  /* Spiel: hinter einem Punkt herrennen. Unterbricht den Tagesablauf. */
  const folge = useCallback((ort) => {
    gefuehrtRef.current = true;
    const von = posRef.current;
    const dauer = jagdDauer(von, ort);
    const richtung = ort.x < von.x - 2 ? -1 : ort.x > von.x + 2 ? 1 : (von.richtung ?? -1);
    posRef.current = { x: ort.x, y: ort.y, richtung };
    setKatze({ pos: { x: ort.x, y: ort.y }, richtung, dauer, laeuft: dauer > 250, art: 'jagen', blase: null, springt: false });
    warte(dauer, () => setKatze((k) => ({ ...k, laeuft: false, dauer: 0 })));
  }, [warte]);

  /* Spiel vorbei: weitermachen wie vorher. */
  const freigeben = useCallback(() => {
    if (!gefuehrtRef.current) return;
    gefuehrtRef.current = false;
    warte(800, () => durchgangRef.current?.());
  }, [warte]);

  /* Wo sie gerade wirklich ist (Ziel des laufenden Übergangs) – für die Spiele. */
  const wo = useCallback(() => posRef.current, []);

  return { ...katze, folge, freigeben, wo };
}
