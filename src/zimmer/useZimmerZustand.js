import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useCatCoins from '../cat/useCatCoins.js';
import useCatNeeds from '../cat/useCatNeeds.js';
import useKatzenladen from '../cat/useKatzenladen.js';
import useWachstum from '../cat/useWachstum.js';
import { MEDIZIN_PREIS, bedarf, schlaeft } from '../cat/tamagotchi.js';
import { FREUNDSCHAFT_FUETTERN, tagesSchluessel } from '../cat/wachstum.js';
import { einrichtung } from './einrichtung.js';
import { wirkung } from './verhalten.js';

const KEY_NAPF = 'zimmer_napf';
const KEY_NOTRATION = 'zimmer_notration';
export const NOTRATION = 20;      // so viel kommt kostenlos in den Napf
export const BILLIGSTES_FUTTER = 3;

const lesenZahl = (key, ersatz) => {
  try {
    const roh = localStorage.getItem(key);
    if (roh === null) return ersatz;
    const n = Number(roh);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : ersatz;
  } catch { return ersatz; }
};

/*
  Zustand für Küchenkarte und Katzenzimmer – genau EINMAL in der App.

  Nutzt die vorhandenen Hooks, damit Münzen, Bedürfnisse, Besitz und
  Freundschaft dieselben bleiben wie bei der alten Katze. Die alte Katze darf
  deshalb nicht gleichzeitig laufen: zwei Instanzen würden dieselben Werte
  doppelt verfallen lassen (App.jsx schaltet sie mit ?zimmer ab).

  Neu ist nur der Napf: Füttern füllt ihn, gefressen wird, wenn die Katze
  Hunger hat (Design 2026-10-06).
*/
export default function useZimmerZustand() {
  const muenzen = useCatCoins();
  const laden = useKatzenladen(muenzen.stand, muenzen.setStand, () => {});
  const beduerfnisse = useCatNeeds(0, laden.wirkung);
  const wachstum = useWachstum(beduerfnisse.zustand.key, () => {});
  const [napf, setNapf] = useState(() => lesenZahl(KEY_NAPF, 30));

  useEffect(() => {
    try { localStorage.setItem(KEY_NAPF, String(Math.round(napf))); } catch { /* gesperrt */ }
  }, [napf]);

  const { moebel, frei } = useMemo(() => einrichtung(laden.besitz), [laden.besitz]);

  // Die Verhaltenslogik liest über einen Ref – der Ablauf startet nur einmal
  const lageRef = useRef(null);
  lageRef.current = {
    hunger: beduerfnisse.hunger,
    durst: beduerfnisse.thirst,
    krank: beduerfnisse.krank,
    nacht: schlaeft(),
    napf,
    moebel,
  };

  const { fuettern, traenken, erfreuen } = beduerfnisse;
  const anwenden = useCallback((art) => {
    const w = wirkung(art, lageRef.current);
    if (w.hunger) fuettern(w.hunger);
    if (w.durst) traenken(w.durst);
    if (w.laune) erfreuen(w.laune);
    if (w.napf) setNapf((v) => Math.max(0, Math.min(100, v + w.napf)));
  }, [fuettern, traenken, erfreuen]);
  const anwendenRef = useRef(anwenden);
  anwendenRef.current = anwenden;

  /* Futter in den Napf – kostet Münzen, nie über voll hinaus. */
  const napfFuellen = useCallback((menge, preis) => {
    if (muenzen.stand < preis || napf >= 100) return false;
    muenzen.setStand((c) => c - preis);
    setNapf((v) => Math.min(100, v + menge));
    wachstum.naeherKommen(FREUNDSCHAFT_FUETTERN);
    return true;
  }, [muenzen, napf, wachstum]);

  /*
    Keine Sackgasse: Wer keine Münzen fürs billigste Futter hat, bekommt einmal
    am Tag eine Notration. Vorher stand auf einem Gerät ohne Münzen eine
    hungrige Katze, die sich nicht füttern liess (Analyse 2026-10-06).
  */
  const [notrationAm, setNotrationAm] = useState(() => {
    try { return localStorage.getItem(KEY_NOTRATION); } catch { return null; }
  });
  const notrationHeute = notrationAm === tagesSchluessel();
  const notrationMoeglich = muenzen.stand < BILLIGSTES_FUTTER && napf < 100;
  const notrationGeben = useCallback(() => {
    if (notrationHeute || !notrationMoeglich) return false;
    setNapf((v) => Math.min(100, v + NOTRATION));
    const heute = tagesSchluessel();
    setNotrationAm(heute);
    try { localStorage.setItem(KEY_NOTRATION, heute); } catch { /* gesperrt */ }
    return true;
  }, [notrationHeute, notrationMoeglich]);

  /*
    Medizin wie bisher für 40 Münzen – mit weniger ist sie kostenlos, damit eine
    kranke Katze nie festsitzt. Die Selbstheilung kommt mit Etappe 3.
  */
  const { heilen } = beduerfnisse;
  const medizinPreis = muenzen.stand >= MEDIZIN_PREIS ? MEDIZIN_PREIS : 0;
  const medizinGeben = useCallback(() => {
    if (!beduerfnisse.krank) return false;
    if (medizinPreis > 0) muenzen.setStand((c) => c - medizinPreis);
    heilen();
    return true;
  }, [beduerfnisse.krank, medizinPreis, muenzen, heilen]);

  const was = bedarf({
    hunger: beduerfnisse.hunger, thirst: beduerfnisse.thirst, freude: beduerfnisse.freude, krank: beduerfnisse.krank,
  });

  return {
    muenzen: muenzen.stand,
    setMuenzen: muenzen.setStand,
    hunger: beduerfnisse.hunger,
    durst: beduerfnisse.thirst,
    laune: beduerfnisse.freude,
    krank: beduerfnisse.krank,
    zustand: beduerfnisse.zustand,
    erfreuen,
    wachstum,
    besitz: laden.besitz,
    angelegt: laden.angelegt,
    // Kein Zufallsfell mehr: sie behält ihr Fell, bis man ein anderes anlegt
    fell: laden.fellVariante ?? 0,
    moebel,
    frei,
    napf,
    napfFuellen,
    notrationMoeglich,
    notrationHeute,
    notrationGeben,
    medizinPreis,
    medizinGeben,
    bedarf: was,
    lageRef,
    anwendenRef,
  };
}
