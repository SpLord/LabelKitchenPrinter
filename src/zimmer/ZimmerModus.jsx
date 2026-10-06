import { useState } from 'react';
import KuechenKarte from './KuechenKarte.jsx';
import useZimmerZustand from './useZimmerZustand.js';
import Zimmer from './Zimmer.jsx';

/*
  Das neue Spiel, solange es hinter ?zimmer entsteht (Design 2026-10-06,
  Etappen 1–7). App.jsx lädt diesen Teil nur mit dem Schalter nach; ohne ihn
  sieht die Küche exakt aus wie vorher.

  Der Zustand lebt hier genau einmal und wird an Karte und Zimmer gereicht –
  zwei Instanzen der Hooks würden dieselben Werte doppelt verfallen lassen.
*/
export default function ZimmerModus() {
  const zustand = useZimmerZustand();
  const [offen, setOffen] = useState(false);
  return (
    <>
      <KuechenKarte zustand={zustand} onOeffnen={() => setOffen(true)} />
      {offen && <Zimmer zustand={zustand} onZu={() => setOffen(false)} />}
    </>
  );
}
