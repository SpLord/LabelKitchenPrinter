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
import { freigeschaltet, freundschaftHeute, grenzeLesen, neuFreigeschaltet } from './herzen.js';
import { einsammeln, fundLesen, fundPruefen } from './fundstuecke.js';

const KEY_NAPF = 'zimmer_napf';
const KEY_WASSER = 'zimmer_wasser';
const KEY_NOTRATION = 'zimmer_notration';
const KEY_KLO = 'zimmer_klo';
const KEY_NAME = 'zimmer_katzenname';
const KEY_PFLEGE = 'zimmer_pflege';
const KEY_GESCHENK = 'zimmer_geschenk';
const KEY_GUT_SEIT = 'zimmer_gut_seit';
const KEY_FREUNDSCHAFT_HEUTE = 'zimmer_freundschaft_heute';
const KEY_HERZEN_GESEHEN = 'zimmer_herzen_gesehen';
const KEY_FUND = 'zimmer_fund';
const KEY_BALL = 'zimmer_ball';

/* Wohin der Ball nach einem Stupser rollt: irgendwo auf den freien Boden. */
const ballZiel = () => ({ x: Math.round(220 + Math.random() * 700), y: Math.round(615 + Math.random() * 40) });

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
  const kann = useCallback((id) => freigeschaltet(wachstum.herzen, id), [wachstum.herzen]);

  /*
    Freundschaft wächst je Quelle und Tag nur begrenzt (Streicheln 3, Spielen 2,
    Füttern 2) – sonst füllt Dauerstreicheln alle Herzen in Minuten und die
    Freischaltungen wären nichts wert.
  */
  const grenzeRef = useRef(undefined);
  if (grenzeRef.current === undefined) grenzeRef.current = grenzeLesen(lesenText(KEY_FREUNDSCHAFT_HEUTE));
  const { naeherKommen } = wachstum;
  const naeher = useCallback((quelle, plus) => {
    const r = freundschaftHeute(grenzeRef.current, quelle, plus, new Date());
    grenzeRef.current = r.stand;
    schreibenText(KEY_FREUNDSCHAFT_HEUTE, JSON.stringify(r.stand));
    if (r.plus > 0) naeherKommen(r.plus);
    return r.plus;
  }, [naeherKommen]);

  // Neue Herzen feiern: was ist seit dem letzten Blick freigeschaltet?
  const [herzenGesehen, setHerzenGesehen] = useState(() => {
    const n = Number(lesenText(KEY_HERZEN_GESEHEN));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  });
  const neueFreischaltungen = useMemo(
    () => neuFreigeschaltet(herzenGesehen, wachstum.herzen), [herzenGesehen, wachstum.herzen],
  );
  const freischaltungenGesehen = useCallback(() => {
    setHerzenGesehen(wachstum.herzen);
    schreibenText(KEY_HERZEN_GESEHEN, String(wachstum.herzen));
  }, [wachstum.herzen]);
  const [napf, setNapf] = useState(() => lesenZahl(KEY_NAPF, 30));
  // Wasserschale (2.5.0): leert sich beim Trinken, Auffüllen ist kostenlos
  const [wasser, setWasser] = useState(() => lesenZahl(KEY_WASSER, 100));
  useEffect(() => {
    try { localStorage.setItem(KEY_WASSER, String(Math.round(wasser))); } catch { /* gesperrt */ }
  }, [wasser]);
  const wasserAuffuellen = useCallback(() => {
    if (wasser >= 100) return false;
    setWasser(100);
    return true;
  }, [wasser]);

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
  const zweitesGeschenk = kann('zweitesGeschenk');
  const geschenkHeute = geschenkDa(abgeholt, new Date(jetzt), zweitesGeschenk);
  // Wo gerade etwas steht, das kein Häufchen neben sich haben soll
  const meidenRef = useRef([]);
  meidenRef.current = [
    geschenkHeute && { x: 790, y: 640 },
    moebel.has('katzengras') && { x: 920, y: 662 },
  ].filter(Boolean);
  const { setStand: setzeMuenzen } = muenzen;
  const geschenkOeffnen = useCallback(() => {
    const r = abholen({
      abgeholt, pflege: pflegeStand, herzen: wachstum.herzen, glueckspfote: laden.wirkung.glueckspfote,
      zweites: zweitesGeschenk,
    }, new Date());
    if (r.muenzen <= 0) return 0;
    setAbgeholt(r.abgeholt);
    schreibenText(KEY_GESCHENK, r.abgeholt);
    setzeMuenzen((c) => c + r.muenzen);
    return r.muenzen;
  }, [abgeholt, pflegeStand, wachstum.herzen, laden.wirkung, setzeMuenzen, zweitesGeschenk]);

  // Fundstücke (fünftes Herz): einmal je Schichttag gewürfelt, im Minutentakt geprüft
  const [fund, setFund] = useState(() => fundLesen(lesenText(KEY_FUND)));
  const fundFrei = kann('fundstuecke');
  const fundRef = useRef(fund);
  fundRef.current = fund;
  useEffect(() => {
    const neu = fundPruefen(fundRef.current, { frei: fundFrei }, new Date(jetzt));
    if (neu === fundRef.current) return;
    fundRef.current = neu;
    setFund(neu);
    schreibenText(KEY_FUND, JSON.stringify(neu));
  }, [fundFrei, jetzt]);
  const fundEinsammeln = useCallback(() => {
    const r = einsammeln(fundRef.current);
    if (!r.id) return null;
    fundRef.current = r.stand;
    setFund(r.stand);
    schreibenText(KEY_FUND, JSON.stringify(r.stand));
    if (r.lohn > 0) setzeMuenzen((c) => c + r.lohn);
    return r;
  }, [setzeMuenzen]);

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

  // Ball (2.4.0): liegt frei im Raum, gespeichert, damit er nach dem Neuladen
  // dort liegt, wo sie ihn hingestupst hat
  const [ball, setBall] = useState(() => {
    try {
      const b = JSON.parse(localStorage.getItem(KEY_BALL));
      if (b && Number.isFinite(b.x) && Number.isFinite(b.y)) return { x: b.x, y: b.y };
    } catch { /* kaputt oder gesperrt */ }
    return { x: 700, y: 650 };
  });
  useEffect(() => {
    try { localStorage.setItem(KEY_BALL, JSON.stringify(ball)); } catch { /* gesperrt */ }
  }, [ball]);

  useEffect(() => {
    const pruefen = () => {
      setJetzt(Date.now());
      setKlo((z) => nachholen(z, { hatKlo, jetzt: Date.now(), meiden: meidenRef.current }));
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
    wasser,
    moebel,
    mussMal: faellig(klo, Date.now()),
    ball,
    sonnenbad: kann('sonnenbad'),
    kloPlatz: hatKlo && klo.klo < KLO.kapazitaet,
  };

  const { fuettern, traenken, erfreuen } = beduerfnisse;
  const hatKloRef = useRef(hatKlo);
  hatKloRef.current = hatKlo;
  const anwenden = useCallback((art, ort = null) => {
    const w = wirkung(art, lageRef.current);
    if (w.gang) setKlo((z) => gang(z, { hatKlo: hatKloRef.current, jetzt: Date.now(), ort, meiden: meidenRef.current }));
    if (w.ball) setBall(ballZiel());
    if (w.hunger) fuettern(w.hunger);
    if (w.durst) traenken(w.durst);
    if (w.laune) erfreuen(w.laune);
    if (w.napf) setNapf((v) => Math.max(0, Math.min(100, v + w.napf)));
    if (w.wasser) setWasser((v) => Math.max(0, Math.min(100, v + w.wasser)));
  }, [fuettern, traenken, erfreuen]);
  const anwendenRef = useRef(anwenden);
  anwendenRef.current = anwenden;

  /* Futter in den Napf – kostet Münzen, nie über voll hinaus. */
  const napfFuellen = useCallback((menge, preis) => {
    if (muenzen.stand < preis || napf >= 100) return false;
    muenzen.setStand((c) => c - preis);
    setNapf((v) => Math.min(100, v + menge));
    naeher('fuettern', FREUNDSCHAFT_FUETTERN);
    pflege('fuettern');
    return true;
  }, [muenzen, napf, naeher, pflege]);

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
    ball,
    nacht: schlaeft(new Date(jetzt)),
    jetzt,
    fundOffen: fund.offen,
    gefunden: fund.gefunden,
    fundEinsammeln,
    kann,
    naeher,
    neueFreischaltungen,
    freischaltungenGesehen,
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
    wasser,
    wasserAuffuellen,
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
