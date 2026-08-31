import { useEffect, useState } from 'react';
import { readInt, writeInt } from './storage.js';

const KEY_STAND = 'cat_coinCount';
const KEY_GIPFEL = 'cat_coinPeak';

/*
  Münzen der Katze.

  Ein Kontostand statt der früheren Aufteilung in Lebenszeit- und Kaufmünzen –
  die war nicht vermittelbar (1410 verdient, davon 2 ausgebbar).

  Daneben läuft ein Höchststand mit: Freischaltungen hängen daran, damit
  Ausgeben nichts wieder zusperrt.
*/
export default function useCatCoins() {
  const [stand, setStand] = useState(0);
  const [gipfel, setGipfel] = useState(0);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    const gespeicherterStand = readInt(KEY_STAND) ?? 0;
    const gespeicherterGipfel = readInt(KEY_GIPFEL);
    setStand(gespeicherterStand);
    // Ohne gespeicherten Höchststand zählt der bisherige Stand als Höchststand,
    // damit beim Umstieg auf eine Währung nichts wieder zugesperrt wird.
    setGipfel(Math.max(gespeicherterGipfel ?? 0, gespeicherterStand));
    setGeladen(true);
  }, []);

  useEffect(() => {
    if (!geladen) return;
    writeInt(KEY_STAND, stand);
    setGipfel((g) => (stand > g ? stand : g));
  }, [stand, geladen]);

  useEffect(() => {
    if (!geladen) return;
    writeInt(KEY_GIPFEL, gipfel);
  }, [gipfel, geladen]);

  return { stand, setStand, gipfel, geladen };
}
