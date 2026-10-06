import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import KatzePose from './KatzePose.jsx';
import { Gedankenblase } from './Moebel.jsx';
import { zustandsText } from './KuechenKarte.jsx';
import { KUECHENKATZE, blaseFuer, freieZone, naechsterSchritt } from './kuechenkatze.js';

const G = KUECHENKATZE.groesse;

/* Freier Streifen der Kopfleiste, in Koordinaten der Kopfleiste selbst. */
function messen(kopf) {
  const karte = document.querySelector('.kuechen-karte');
  const k = kopf.getBoundingClientRect();
  const teile = [...kopf.children]
    .filter((el) => !el.classList.contains('kuechen-katze'))
    .map((el) => el.getBoundingClientRect());
  const z = freieZone({ kopf: k, teile, karte: karte?.getBoundingClientRect() ?? null });
  if (!z) return null;
  return { links: z.links - k.left, rechts: z.rechts - k.left, boden: z.boden - k.top };
}

/*
  Die Katze auf der Etikettenseite: läuft im freien Streifen der Kopfleiste,
  setzt sich, schläft nachts, liegt krank und zeigt in einer Denkblase, was
  ihr fehlt. Ein Tipp auf sie öffnet das Zimmer.

  Sie hängt per Portal IN der Kopfleiste: die ist sticky, also wandert die
  Katze beim Scrollen von selbst mit und kann nie über den Etiketten landen.
  Bewegung per CSS-Übergang auf transform (wie im Zimmer).
*/
export default function KuechenKatze({ zustand, onOeffnen }) {
  const [kopf, setKopf] = useState(null);
  const [zone, setZone] = useState(null);
  const [katze, setKatze] = useState({ x: null, art: 'sitzen', richtung: -1, dauer: 0 });
  const katzeRef = useRef(katze);
  katzeRef.current = katze;
  const lageRef = useRef(zustand);
  lageRef.current = zustand;
  const zoneRef = useRef(zone);
  zoneRef.current = zone;

  // Kopfleiste finden und den freien Streifen bei jeder Änderung neu messen
  useEffect(() => {
    const el = document.querySelector('.app-bar');
    if (!el) return undefined;
    setKopf(el);
    const neu = () => setZone((alt) => {
      const z = messen(el);
      if (!z || !alt) return z;
      return z.links === alt.links && z.rechts === alt.rechts && z.boden === alt.boden ? alt : z;
    });
    neu();
    const ro = new ResizeObserver(neu);
    ro.observe(el);
    const karte = document.querySelector('.kuechen-karte');
    if (karte) ro.observe(karte);
    [...el.children].forEach((c) => ro.observe(c));
    const mo = new MutationObserver(neu);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', neu);
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener('resize', neu); };
  }, []);

  /*
    Ändert sich der Streifen, sofort hinein – ohne Laufen, ohne Übergang.
    Läuft sie gerade, zählt die SICHTBARE Stelle, nicht das Ziel: mitten im
    Weg kann sie schon unter der Karte stehen. Und eine kürzere
    transition-duration hält einen laufenden Übergang nicht an – erst ein
    neuer transform-Wert tut das. (Gefunden von e2e/hauptseite.spec.js.)
  */
  const knopfRef = useRef(null);
  useEffect(() => {
    if (!zone) return;
    const halb = G / 2;
    const k = katzeRef.current;
    let x = k.x;
    if (k.art === 'laufen' && knopfRef.current && kopf) {
      x = knopfRef.current.getBoundingClientRect().left - kopf.getBoundingClientRect().left + halb;
    }
    const mitte = (zone.links + zone.rechts) / 2;
    const passt = x !== null && x >= zone.links + halb && x <= zone.rechts - halb;
    if (passt && k.art !== 'laufen') return;
    const sicher = x === null ? mitte : Math.min(Math.max(x, zone.links + halb), zone.rechts - halb);
    // Ein Hauch Versatz, damit sich der transform-Wert sicher ändert
    const neu = Math.abs(sicher - k.x) < 0.01 ? sicher + 0.01 : sicher;
    setKatze((alt) => ({ ...alt, x: neu, dauer: 0, art: alt.art === 'laufen' ? 'sitzen' : alt.art }));
  }, [zone, kopf]);

  // Tagesablauf: eine Entscheidung nach der anderen
  const sichtbar = zone !== null && katze.x !== null;
  useEffect(() => {
    if (!sichtbar) return undefined;
    let uhr;
    const weiter = () => {
      // Frisch messen: zwischen Grössenänderung und neuem Rendern wäre zoneRef
      // noch der alte Streifen, und sie liefe unter die Karte
      const el = document.querySelector('.app-bar');
      const z = el ? messen(el) : zoneRef.current;
      const k = katzeRef.current;
      if (!z || k.x === null) return;
      const s = naechsterSchritt(lageRef.current, z, k.x);
      if (s.art === 'laufen') {
        setKatze({ x: s.x, art: 'laufen', richtung: s.x > k.x ? 1 : -1, dauer: s.dauer });
        uhr = setTimeout(() => {
          setKatze((alt) => ({ ...alt, art: 'sitzen', dauer: 0 }));
          uhr = setTimeout(weiter, 2_500);
        }, s.dauer);
      } else {
        setKatze((alt) => ({ ...alt, art: s.art, dauer: 0 }));
        uhr = setTimeout(weiter, s.dauer);
      }
    };
    uhr = setTimeout(weiter, 1_500);
    return () => clearTimeout(uhr);
  }, [sichtbar]);

  if (!kopf || !sichtbar) return null;

  const blase = blaseFuer(zustand);
  const pose = katze.art === 'laufen' ? 'laufen'
    : katze.art === 'schlafen' ? 'schlafen'
      : katze.art === 'liegen' ? 'krank' : 'sitzen';
  return createPortal(
    <button
      ref={knopfRef}
      type="button"
      className={`kuechen-katze pose-${pose}`}
      style={{
        transform: `translate(${katze.x - G / 2}px, ${zone.boden - G}px)`,
        transitionDuration: `${katze.dauer}ms`,
      }}
      onClick={onOeffnen}
      aria-label={`${zustand.name} ${zustandsText(zustand)} – Katzenzimmer öffnen`}
    >
      <span className="kuechen-katze-koerper"
            style={{ transform: `scale(${-katze.richtung * zustand.wachstum.phase.groesse}, ${zustand.wachstum.phase.groesse})` }}>
        <KatzePose pose={pose} fell={zustand.fell} zubehoer={zustand.angelegt} aktiv={katze.art === 'laufen'} />
      </span>
      {pose === 'schlafen' && <span className="kuechen-katze-zzz" aria-hidden="true">z<b>Z</b></span>}
      {blase && pose !== 'schlafen' && (
        <svg className="kuechen-katze-blase" viewBox="0 0 84 72" aria-hidden="true">
          <Gedankenblase was={blase} />
        </svg>
      )}
    </button>,
    kopf,
  );
}
