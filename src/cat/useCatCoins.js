import { useEffect, useState } from 'react';
import { readInt, writeInt } from './storage.js';

const KEY_STAND = 'cat_coinCount';

/*
  Münzen der Katze – ein Kontostand.

  Bis Etappe 8 lief daneben ein Höchststand mit, an dem die Freischaltungen
  des alten Spiels hingen. Fortschritt kommt jetzt allein über die Herzen
  (src/zimmer/herzen.js); der Höchststand ist entfallen.
*/
export default function useCatCoins() {
  const [stand, setStand] = useState(0);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    setStand(readInt(KEY_STAND) ?? 0);
    setGeladen(true);
  }, []);

  useEffect(() => {
    if (!geladen) return;
    writeInt(KEY_STAND, stand);
  }, [stand, geladen]);

  return { stand, setStand, geladen };
}
