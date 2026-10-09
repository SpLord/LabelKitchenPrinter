import { useEffect, useRef, useState } from 'react';
import KatzePose, { poseFuer } from './KatzePose.jsx';
import { Gedankenblase } from './Moebel.jsx';
import { zustandsText } from './KuechenKarte.jsx';
import { FREUDE_STREICHELN } from '../cat/tamagotchi.js';
import { FREUNDSCHAFT_STREICHELN } from '../cat/wachstum.js';
import { KUECHENKATZE, blaseFuer, naechsterSchritt, spruchZumEtikett, waehleEbene } from './kuechenkatze.js';
import useKuechenEbenen from './useKuechenEbenen.js';

const G = KUECHENKATZE.groesse;
const SPRUNG = 650;            // ms für einen Sprung zwischen Ebenen
const MENUE_OFFEN = 5000;      // so lange bleibt die Blase nach einem Tipp
const FUTTER = { menge: 20, preis: 3 };

const klemmen = (x, e) => Math.min(Math.max(x, e.links + G / 2), e.rechts - G / 2);

/*
  Die Katze auf der Etikettenseite (2.2.0).

  Sie läuft im freien Streifen der Kopfleiste und springt in freie Böden
  unter kürzeren Spalten – nie über Etikettenknöpfe (useKuechenEbenen misst
  laufend, was frei ist). Antippen: sie schnurrt, Herzchen, und eine kleine
  Blase bietet Füttern und das Zimmer an. Wird ein Etikett gedruckt, freut sie
  sich darüber.

  Position fest im Fenster (position: fixed) in Bildschirmkoordinaten;
  Bewegung per CSS-Übergang auf transform.
*/
export default function KuechenKatze({ zustand, onOeffnen }) {
  const ebenen = useKuechenEbenen();
  const [katze, setKatze] = useState({ ebene: null, x: null, art: 'sitzen', richtung: -1, dauer: 0, springt: false });
  const [menue, setMenue] = useState(false);
  const [spruch, setSpruch] = useState(null);
  const [herzen, setHerzen] = useState(0);
  const [muenze, setMuenze] = useState(null);   // Etiketten-Münze (2.6.0)
  const katzeRef = useRef(katze);
  katzeRef.current = katze;
  const ebenenRef = useRef(ebenen);
  ebenenRef.current = ebenen;
  const lageRef = useRef(zustand);
  lageRef.current = zustand;
  const knopfRef = useRef(null);

  // Ebenen geändert (Scrollen, Grösse, neue Fehlermeldung …): ist sie noch auf
  // freiem Grund? Sonst sofort an eine sichere Stelle – an der SICHTBAREN
  // Position gemessen, ein laufender Übergang wird damit abgebrochen.
  useEffect(() => {
    if (!ebenen.length) return;
    const k = katzeRef.current;
    const hier = ebenen.find((e) => e.id === k.ebene);
    let x = k.x;
    if (k.art === 'laufen' && knopfRef.current) {
      const r = knopfRef.current.getBoundingClientRect();
      x = r.left + G / 2;
    }
    if (hier && x !== null && x === klemmen(x, hier) && k.art !== 'laufen') return;
    const ziel = hier ?? ebenen[0];
    const neuX = x === null ? (ziel.links + ziel.rechts) / 2 : klemmen(x, ziel);
    setKatze((alt) => ({
      ...alt, ebene: ziel.id, x: Math.abs(neuX - (alt.x ?? 0)) < 0.01 ? neuX + 0.01 : neuX,
      dauer: 0, springt: false, art: alt.art === 'laufen' ? 'sitzen' : alt.art,
    }));
  }, [ebenen]);

  // Tagesablauf: laufen, sitzen, manchmal auf eine andere Ebene springen
  const da = ebenen.length > 0 && katze.x !== null;
  useEffect(() => {
    if (!da) return undefined;
    let uhr;
    const weiter = () => {
      const k = katzeRef.current;
      const alle = ebenenRef.current;
      const lage = lageRef.current;
      if (!alle.length || k.x === null) return;
      const hier = alle.find((e) => e.id === k.ebene) ?? alle[0];
      const ruhig = lage.krank || lage.nacht;
      const ziel = ruhig ? hier : waehleEbene(alle, hier.id);
      if (ziel.id !== hier.id) {
        const x = ziel.links + Math.random() * Math.max(0, ziel.rechts - ziel.links - G) + G / 2;
        setKatze({ ebene: ziel.id, x, art: 'laufen', richtung: x > k.x ? 1 : -1, dauer: SPRUNG, springt: true });
        // Etwas länger als der Sprung: erst sicher gelandet wird sie wieder antippbar
        uhr = setTimeout(() => {
          setKatze((alt) => ({ ...alt, art: 'sitzen', dauer: 0, springt: false }));
          uhr = setTimeout(weiter, 2_500);
        }, SPRUNG + 150);
        return;
      }
      const s = naechsterSchritt(lage, hier, k.x);
      if (s.art === 'laufen') {
        setKatze({ ebene: hier.id, x: s.x, art: 'laufen', richtung: s.x > k.x ? 1 : -1, dauer: s.dauer, springt: false });
        uhr = setTimeout(() => {
          setKatze((alt) => ({ ...alt, art: 'sitzen', dauer: 0 }));
          uhr = setTimeout(weiter, 2_500);
        }, s.dauer);
      } else {
        setKatze((alt) => ({ ...alt, art: s.art, dauer: 0, springt: false }));
        uhr = setTimeout(weiter, s.dauer);
      }
    };
    uhr = setTimeout(weiter, 1_500);
    return () => clearTimeout(uhr);
  }, [da]);

  // Ein Etikett wurde gedruckt: sie freut sich darüber
  useEffect(() => {
    const gedruckt = (e) => setSpruch({ id: Date.now(), text: spruchZumEtikett(e.detail?.name) });
    window.addEventListener('etikett-gedruckt', gedruckt);
    return () => window.removeEventListener('etikett-gedruckt', gedruckt);
  }, []);
  useEffect(() => {
    const lohn = (e) => setMuenze({ id: Date.now(), lohn: e.detail?.lohn ?? 1 });
    window.addEventListener('druck-muenze', lohn);
    return () => window.removeEventListener('druck-muenze', lohn);
  }, []);
  useEffect(() => {
    if (!muenze) return undefined;
    const t = setTimeout(() => setMuenze(null), 1200);
    return () => clearTimeout(t);
  }, [muenze]);
  useEffect(() => {
    if (!spruch) return undefined;
    const t = setTimeout(() => setSpruch(null), 2600);
    return () => clearTimeout(t);
  }, [spruch]);
  useEffect(() => {
    if (!menue) return undefined;
    const t = setTimeout(() => setMenue(false), MENUE_OFFEN);
    return () => clearTimeout(t);
  }, [menue]);

  if (!da) return null;
  const ebene = ebenen.find((e) => e.id === katze.ebene) ?? ebenen[0];

  const antippen = () => {
    // Streicheln: wie im Zimmer, mit Tagesgrenze für die Freundschaft
    zustand.erfreuen(FREUDE_STREICHELN);
    zustand.naeher('streicheln', FREUNDSCHAFT_STREICHELN);
    zustand.pflege('streicheln');
    setHerzen((n) => n + 1);
    setMenue(true);
  };
  const fuettern = () => {
    if (zustand.napfFuellen(FUTTER.menge, FUTTER.preis)) setSpruch({ id: Date.now(), text: 'Danke! Mjam!' });
    setMenue(false);
  };
  const futterGeht = zustand.napf < 100 && zustand.muenzen >= FUTTER.preis;
  // Wasser (2.5.0): nur anbieten, wenn die Schale nicht voll ist und kein Brunnen steht
  const wasserNoetig = !zustand.moebel.has('trinkbrunnen') && zustand.wasser < 100;
  const wasserGeben = () => {
    if (zustand.wasserAuffuellen()) setSpruch({ id: Date.now(), text: 'Frisches Wasser!' });
    setMenue(false);
  };

  const blase = blaseFuer(zustand);
  const pose = poseFuer({ laeuft: katze.art === 'laufen', art: katze.art });
  // Blase unter der Katze, wenn oben kein Platz ist (Kopfleiste)
  const unten = ebene.boden < 200;
  const groesse = zustand.wachstum.phase.groesse;
  return (
    <div className={`kuechen-katze-ebene ${katze.springt ? 'springt' : ''}`}
         // Wo sie gerade hin darf – für Tests und zum Nachsehen im Browser
         data-ebenen={JSON.stringify(ebenen.map((e) => [e.id, Math.round(e.links), Math.round(e.rechts), Math.round(e.boden)]))}
         style={{ transform: `translate(${katze.x - G / 2}px, ${ebene.boden - G}px)`, transitionDuration: `${katze.dauer}ms` }}>
      <button
        ref={knopfRef}
        type="button"
        className={`kuechen-katze pose-${pose}`}
        onClick={antippen}
        aria-label={`${zustand.name} ${zustandsText(zustand)} – streicheln`}
      >
        <span className="kuechen-katze-koerper"
              style={{ transform: `scale(${-katze.richtung * groesse}, ${groesse})` }}>
          <span key={pose} className="pose-ein">
            <KatzePose pose={pose} fell={zustand.fell} zubehoer={zustand.angelegt} aktiv={katze.art === 'laufen'} />
          </span>
        </span>
        {pose === 'schlafen' && <span className="kuechen-katze-zzz" aria-hidden="true">z<b>Z</b></span>}
        {blase && pose !== 'schlafen' && !menue && !spruch && (
          <svg className="kuechen-katze-blase" viewBox="0 0 84 72" aria-hidden="true">
            <Gedankenblase was={blase} />
          </svg>
        )}
      </button>
      {herzen > 0 && <span key={herzen} className="kuechen-katze-herz" aria-hidden="true" />}
      {muenze && (
        <span key={muenze.id} className="kuechen-katze-muenze" aria-hidden="true">
          <span className="zimmer-muenze" />+{muenze.lohn}
        </span>
      )}
      {spruch && !menue && (
        <span key={spruch.id} className={`kuechen-katze-spruch ${unten ? 'unten' : ''}`} role="status">{spruch.text}</span>
      )}
      {menue && (
        <div className={`kuechen-katze-menue ${unten ? 'unten' : ''}`} role="group" aria-label={`${zustand.name} – was tun?`}>
          <button type="button" onClick={fuettern} disabled={!futterGeht}>
            Füttern <span className="zimmer-muenze" aria-hidden="true" /> {FUTTER.preis}
          </button>
          {wasserNoetig && <button type="button" onClick={wasserGeben}>Wasser</button>}
          <button type="button" className="los" onClick={() => { setMenue(false); onOeffnen(); }}>Zimmer ›</button>
        </div>
      )}
    </div>
  );
}
