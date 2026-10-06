import { useEffect, useRef, useState } from 'react';
import { ORTE, naechsteTaetigkeit, wegDauer } from './verhalten.js';

/*
  Taktgeber der Katze im Zimmer.

  Ein Durchgang: entscheiden (verhalten.js) → hinlaufen → Tätigkeit ausführen
  → Wirkung anwenden → von vorn. Der Lauf selbst ist ein CSS-Übergang; hier
  wird nur gesetzt, WOHIN und WIE LANGE.

  lageRef und anwendenRef sind Refs, damit dieser Ablauf genau einmal startet.
  Hinge er an den Bedürfnissen, würde er bei jeder Änderung neu beginnen –
  derselbe Fehler, der den Zufriedenheitsverfall monatelang lahmgelegt hat.
*/
export default function useKatzeImZimmer(lageRef, anwendenRef) {
  const start = { ...ORTE.liegen, x: 720 };
  const posRef = useRef(start);
  const [katze, setKatze] = useState({
    pos: start, richtung: -1, dauer: 0, laeuft: false, art: 'sitzen', blase: null,
  });

  useEffect(() => {
    let aus = false;
    let uhr = null;
    const warte = (ms, f) => { uhr = setTimeout(() => { if (!aus) f(); }, ms); };

    const durchgang = () => {
      const t = naechsteTaetigkeit(lageRef.current);
      const von = posRef.current;
      const nach = t.ort ?? von;
      const weg = t.ort ? wegDauer(von, nach) : 0;
      const richtungUnterwegs = nach.x < von.x - 2 ? -1 : nach.x > von.x + 2 ? 1 : (von.richtung ?? -1);
      posRef.current = { x: nach.x, y: nach.y, richtung: nach.richtung ?? richtungUnterwegs };

      setKatze({ pos: { x: nach.x, y: nach.y }, richtung: richtungUnterwegs, dauer: weg, laeuft: weg > 0, art: t.art, blase: t.blase });

      // Angekommen: zum Ziel hin ausrichten, dann die Tätigkeit
      warte(weg, () => {
        setKatze((k) => ({ ...k, laeuft: false, dauer: 0, richtung: nach.richtung ?? k.richtung }));
        warte(t.dauer, () => {
          anwendenRef.current?.(t.art);
          setKatze((k) => ({ ...k, blase: null }));
          warte(400, durchgang);
        });
      });
    };

    warte(900, durchgang);
    return () => { aus = true; clearTimeout(uhr); };
  }, [lageRef, anwendenRef]);

  return katze;
}
