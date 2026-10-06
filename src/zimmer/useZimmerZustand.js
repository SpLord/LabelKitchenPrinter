import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useCatCoins from '../cat/useCatCoins.js';
import useCatNeeds from '../cat/useCatNeeds.js';
import useKatzenladen from '../cat/useKatzenladen.js';
import useWachstum from '../cat/useWachstum.js';
import { MEDIZIN_PREIS, bedarf, schlaeft } from '../cat/tamagotchi.js';
import { FREUNDSCHAFT_FUETTERN, tagesSchluessel } from '../cat/wachstum.js';
import { einrichtung } from './einrichtung.js';
import { KLO, faellig, gang, haeufchenWeg, kloLeeren, lesen as kloLesen, nachholen } from './klo.js';
import { wirkung } from './verhalten.js';
import { STANDARD_NAME, putzeName } from './katzenname.js';
import { abholen, geschenkDa, pflegeLesen, pflegen, selbstheilung } from './geschenk.js';

const KEY_NAPF = 'zimmer_napf';
const KEY_NOTRATION = 'zimmer_notration';
const KEY_KLO = 'zimmer_klo';
const KEY_NAME = 'zimmer_katzenname';
const KEY_PFLEGE = 'zimmer_pflege';
const KEY_GESCHENK = 'zimmer_geschenk';
const KEY_GUT_SEIT = 'zimmer_gut_seit';

const lesenText = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const schreibenText = (key, wert) => {
  try { if (wert === null) localStorage.removeItem(key); else localStorage.setItem(key, wert); } catch { /* gesperrt */ }
};
const NACHHOLEN_ALLE = 60_000;
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

  // Klo und Häufchen (Etappe 3) – die Häufchen drücken die Laune
  const [klo, setKlo] = useState(() => {
    try { return kloLesen(localStorage.getItem(KEY_KLO), Date.now()); } catch { return kloLesen(null, Date.now()); }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY_KLO, JSON.stringify(klo)); } catch { /* gesperrt */ }
  }, [klo]);

  const beduerfnisse = useCatNeeds(klo.haeufchen.length, laden.wirkung);
  const wachstum = useWachstum(beduerfnisse.zustand.key, () => {});
  const [napf, setNapf] = useState(() => lesenZahl(KEY_NAPF, 30));

  // Eigener Name – "Mails" ist der Koch
  const [name, setNameRoh] = useState(() => {
    try { return putzeName(localStorage.getItem(KEY_NAME)) ?? STANDARD_NAME; } catch { return STANDARD_NAME; }
  });
  const umbenennen = useCallback((roh) => {
    const neu = putzeName(roh);
    if (!neu) return;
    setNameRoh(neu);
    try { localStorage.setItem(KEY_NAME, neu); } catch { /* gesperrt */ }
  }, []);

  // Hütchenspiel: Siegesserie wie bei der alten Katze (gleicher Schlüssel)
  const [huetchenSerie, setHuetchenSerieRoh] = useState(() => {
    const v = parseInt(lesenText('cat_shellStreak') ?? '0', 10);
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const setHuetchenSerie = useCallback((wert) => {
    setHuetchenSerieRoh((alt) => {
      const neu = typeof wert === 'function' ? wert(alt) : wert;
      schreibenText('cat_shellStreak', String(neu));
      return neu;
    });
  }, []);

  // Pflegepunkte: wer sich heute kümmert, bekommt morgen ein grösseres Geschenk
  const [pflegeStand, setPflegeStand] = useState(() => pflegeLesen(lesenText(KEY_PFLEGE)));
  const pflege = useCallback((art) => {
    setPflegeStand((p) => {
      const neu = pflegen(p, art, new Date());
      schreibenText(KEY_PFLEGE, JSON.stringify(neu));
      return neu;
    });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY_NAPF, String(Math.round(napf))); } catch { /* gesperrt */ }
  }, [napf]);

  // Minutentakt: Geschenk ab 5 Uhr, Selbstheilung, verpasste Klogänge
  const [jetzt, setJetzt] = useState(() => Date.now());
  // (der Takt selbst läuft weiter unten, zusammen mit den Klogängen)
  const { moebel, frei } = useMemo(() => einrichtung(laden.besitz), [laden.besitz]);

  // Tägliches Geschenk – einmal je Schichttag, ab 5 Uhr
  const [abgeholt, setAbgeholt] = useState(() => lesenText(KEY_GESCHENK));
  const geschenkHeute = geschenkDa(abgeholt, new Date(jetzt));
  const { setStand: setzeMuenzen } = muenzen;
  const geschenkOeffnen = useCallback(() => {
    const r = abholen({
      abgeholt, pflege: pflegeStand, herzen: wachstum.herzen, glueckspfote: laden.besitz.includes('glueckspfote'),
    }, new Date());
    if (r.muenzen <= 0) return 0;
    setAbgeholt(r.abgeholt);
    schreibenText(KEY_GESCHENK, r.abgeholt);
    setzeMuenzen((c) => c + r.muenzen);
    return r.muenzen;
  }, [abgeholt, pflegeStand, wachstum.herzen, laden.besitz, setzeMuenzen]);

  // Selbstheilung: zwölf Stunden gut versorgt → gesund, auch ohne Medizin
  const gutSeitRef = useRef(null);
  if (gutSeitRef.current === null) {
    const roh = Number(lesenText(KEY_GUT_SEIT));
    gutSeitRef.current = { wert: Number.isFinite(roh) && roh > 0 ? roh : null };
  }
  const { heilen: heilenNeeds } = beduerfnisse;
  useEffect(() => {
    const r = selbstheilung({
      krank: beduerfnisse.krank, hunger: beduerfnisse.hunger, durst: beduerfnisse.thirst, gutSeit: gutSeitRef.current.wert,
    }, jetzt);
    if (r.gutSeit !== gutSeitRef.current.wert) {
      gutSeitRef.current.wert = r.gutSeit;
      schreibenText(KEY_GUT_SEIT, r.gutSeit === null ? null : String(r.gutSeit));
    }
    if (r.heilt) heilenNeeds();
  }, [beduerfnisse.krank, beduerfnisse.hunger, beduerfnisse.thirst, jetzt, heilenNeeds]);
  const hatKlo = moebel.has('katzenklo');

  useEffect(() => {
    const pruefen = () => {
      setJetzt(Date.now());
      setKlo((z) => nachholen(z, { hatKlo, jetzt: Date.now() }));
    };
    pruefen();
    const uhr = setInterval(pruefen, NACHHOLEN_ALLE);
    return () => clearInterval(uhr);
  }, [hatKlo]);

  // Die Verhaltenslogik liest über einen Ref – der Ablauf startet nur einmal
  const lageRef = useRef(null);
  lageRef.current = {
    hunger: beduerfnisse.hunger,
    durst: beduerfnisse.thirst,
    krank: beduerfnisse.krank,
    nacht: schlaeft(),
    napf,
    moebel,
    mussMal: faellig(klo, Date.now()),
    kloPlatz: hatKlo && klo.klo < KLO.kapazitaet,
  };

  const { fuettern, traenken, erfreuen } = beduerfnisse;
  const hatKloRef = useRef(hatKlo);
  hatKloRef.current = hatKlo;
  const anwenden = useCallback((art, ort = null) => {
    const w = wirkung(art, lageRef.current);
    if (w.gang) setKlo((z) => gang(z, { hatKlo: hatKloRef.current, jetzt: Date.now(), ort }));
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
    pflege('fuettern');
    return true;
  }, [muenzen, napf, wachstum, pflege]);

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

  /* Putzen: Klo leeren und Häufchen wegmachen – Lohn bis zur Tagesgrenze. */
  const { setStand } = muenzen;
  // Synchron über einen Ref: der Lohn muss sofort feststehen, und ein schneller
  // Doppeltipp darf nicht zweimal zahlen
  const kloRef = useRef(klo);
  kloRef.current = klo;
  const putzen = useCallback((was) => {
    const z = kloRef.current;
    const r = was === 'klo' ? kloLeeren(z, tagesSchluessel()) : haeufchenWeg(z, was, tagesSchluessel());
    if (r.zustand === z) return 0;
    kloRef.current = r.zustand;
    setKlo(r.zustand);
    pflege('putzen');
    if (r.lohn > 0) setStand((c) => c + r.lohn);
    return r.lohn;
  }, [setStand, pflege]);

  const was = bedarf({
    hunger: beduerfnisse.hunger, thirst: beduerfnisse.thirst, freude: beduerfnisse.freude, krank: beduerfnisse.krank,
    haeufchen: klo.haeufchen.length,
  });

  return {
    name,
    umbenennen,
    huetchenSerie,
    setHuetchenSerie,
    pflege,
    geschenkHeute,
    geschenkOeffnen,
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
    kaufen: laden.kaufeUndLege,
    umschalten: laden.umschalten,
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
    klo: klo.klo,
    haeufchen: klo.haeufchen,
    putzen,
    lageRef,
    anwendenRef,
  };
}
