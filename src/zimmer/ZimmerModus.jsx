import { useState } from 'react';
import KuechenKarte from './KuechenKarte.jsx';
import KuechenKatze from './KuechenKatze.jsx';
import useZimmerZustand from './useZimmerZustand.js';
import Zimmer from './Zimmer.jsx';

/*
  Das Katzenspiel auf der Hauptseite (Design 2026-10-06): Karte und
  Küchenkatze in der Kopfleiste, das Zimmer als Vollbild darüber.

  Der Zustand lebt hier genau einmal und wird an Karte und Zimmer gereicht –
  zwei Instanzen der Hooks würden dieselben Werte doppelt verfallen lassen.
*/
export default function ZimmerModus() {
  const zustand = useZimmerZustand();
  const [offen, setOffen] = useState(false);
  return (
    <>
      <KuechenKarte zustand={zustand} onOeffnen={() => setOffen(true)} />
      {!offen && <KuechenKatze zustand={zustand} onOeffnen={() => setOffen(true)} />}
      {offen && <Zimmer zustand={zustand} onZu={() => setOffen(false)} />}
    </>
  );
}
