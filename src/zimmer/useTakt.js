import { useEffect, useRef } from 'react';

/*
  Bildtakt für die Echtzeit-Spiele (Gurkenhüpfer, Angeln): ruft schritt(dt)
  einmal je Bild, dt in Sekunden. Läuft nur, solange laeuft wahr ist.
  schritt darf sich bei jedem Rendern ändern – es wird über eine Ref gelesen,
  damit die Schleife nicht neu startet.
*/
export default function useTakt(schritt, laeuft = true) {
  const schrittRef = useRef(schritt);
  schrittRef.current = schritt;
  useEffect(() => {
    if (!laeuft) return undefined;
    let id = 0;
    let vorher = null;
    const bild = (jetzt) => {
      if (vorher !== null) schrittRef.current((jetzt - vorher) / 1000);
      vorher = jetzt;
      id = requestAnimationFrame(bild);
    };
    id = requestAnimationFrame(bild);
    return () => cancelAnimationFrame(id);
  }, [laeuft]);
}
