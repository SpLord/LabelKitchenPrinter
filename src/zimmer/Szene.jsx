import { useEffect, useRef, useState } from 'react';
import KatzePose, { poseFuer } from './KatzePose.jsx';
import { PLAETZE } from './einrichtung.js';
import { Besucher, FundstueckBild, Gestirn, Wandlampe } from './Fensterwelt.jsx';
import { LICHT } from './tageszeit.js';
import {
  FreierPlatz, Futterautomat, Gedankenblase, Geschenk, Haeufchen, Katzenklo, Kratzbaum, Kuschelhoehle, Napf, Trinkbrunnen, Wassernapf,
} from './Moebel.jsx';

const KONTUR = '#2f2a26';
const KATZE = 150;   // Kantenlänge der Katze in Szenenpunkten

/*
  Das Zimmer als eine SVG-Szene, 1024 × 768 – genau die Grösse des
  Küchentablets. Auf breiteren Bildschirmen wird sie mittig eingepasst.

  Die Katze ist eine eigene Ebene, bewegt per CSS-Übergang auf transform:
  das rechnet die Grafikkarte, nicht React pro Bild. Im September hat genau
  dieser Unterschied die Bildrate gerettet.
*/
/* So weit laufen Wand und Boden über die Szene hinaus (Szenenpunkte). */
const W = 1600;
const TAPETE = Array.from({ length: Math.ceil((1024 + 2 * W) / 140) }, (_, i) => 60 - Math.ceil(W / 140) * 140 + i * 140);

/*
  Ausschnitt passend zur echten Grösse: die Szene deckt den ganzen Bildschirm,
  der 1024 × 768-Inhalt liegt aber genau dort, wo die 4:3-Bühne ist (gleiche
  Mitte, gleicher Massstab). So passen Spiele, Herzchen und Münz-Pops, die in
  Bühnenprozent rechnen, weiter – und links und rechts gibt es keinen Rand.
*/
function useAusschnitt() {
  const svgRef = useRef(null);
  const [viewBox, setViewBox] = useState('0 0 1024 768');
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const messen = () => {
      const { width: b, height: h } = el.getBoundingClientRect();
      if (!b || !h) return;
      const s = Math.min(b / 1024, h / 768);
      const w = b / s;
      const hh = h / s;
      setViewBox(`${((1024 - w) / 2).toFixed(1)} ${((768 - hh) / 2).toFixed(1)} ${w.toFixed(1)} ${hh.toFixed(1)}`);
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { svgRef, viewBox };
}

export default function Szene({
  moebel, frei, napf, klo = 0, kloVoll = false, haeufchen = [], katze, fell, zubehoer, onKatze, onPutzen = () => {}, neu = null, onFrei = () => {}, geschenk = false, onGeschenk = () => {}, rollt = false,
  tageszeit = 'tag', besuch = null, fund = null, onFund = () => {}, groesse = 1,
}) {
  const licht = LICHT[tageszeit] ?? LICHT.tag;
  const { svgRef, viewBox } = useAusschnitt();
  // Frisch gekauftes Möbel ploppt einmal auf
  const plopp = (id) => (neu === id ? 'zimmer-neu' : undefined);
  const { pos, richtung, dauer, laeuft, blase, art } = katze;
  const pose = poseFuer({ laeuft, art });
  return (
    <svg ref={svgRef} className="zimmer-szene" viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
         role="img" aria-label="Katzenzimmer">
      <defs>
        <filter id="zimmer-weich" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" /></filter>
        <linearGradient id="zimmer-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={licht.himmel[0]} /><stop offset="1" stopColor={licht.himmel[1]} /></linearGradient>
        <clipPath id="zimmer-fenster"><rect x="73" y="113" width="194" height="174" rx="8" /></clipPath>
      </defs>

      {/* Wand mit Streifentapete */}
      {/* Wand und Boden reichen weit über die 1024 × 768 hinaus: auf breiten
          oder hohen Bildschirmen läuft das Zimmer bis an den Rand weiter */}
      <rect x={-W} y={-W} width={1024 + 2 * W} height={470 + W} fill="#fbecd6" />
      <g fill="#f4dfc0">{TAPETE.map((x) => <rect key={x} x={x} y={-W} width="14" height={470 + W} />)}</g>

      {/* Dielenboden */}
      <rect x={-W} y="466" width={1024 + 2 * W} height={302 + W} fill="#e3b88b" />
      <g stroke="#c4935f" strokeWidth="4">
        {[520, 580, 646, 712, 778, 844].map((y) => <line key={y} x1={-W} y1={y} x2={1024 + W} y2={y} />)}
        <line x1="180" y1="466" x2="170" y2="520" /><line x1="560" y1="520" x2="550" y2="580" /><line x1="820" y1="580" x2="810" y2="646" />
      </g>
      <rect x={-W} y="458" width={1024 + 2 * W} height="14" fill="#fff" />
      <line x1={-W} y1="472" x2={1024 + W} y2="472" stroke={KONTUR} strokeWidth="5" />

      <g stroke={KONTUR} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        {/* Fenster */}
        <rect x="70" y="110" width="200" height="180" rx="10" fill="url(#zimmer-himmel)" />
        {/* Tageszeit nach der echten Uhr (Etappe 7) und wer am Fenster vorbeikommt */}
        <g clipPath="url(#zimmer-fenster)">
          <Gestirn art={licht.gestirn} />
          {tageszeit !== 'nacht' && <path d="M92 168 q14 -16 30 -4 q12 -10 22 4" fill="#fff" strokeWidth="3.5" />}
          {besuch && <g key={besuch.id}><Besucher art={besuch.art} /></g>}
        </g>
        <path d="M170 110 V290 M70 200 H270" strokeWidth="6" />
        <rect x="58" y="288" width="226" height="18" rx="5" fill="#fff" />
        {/* Bild an der Wand */}
        <rect x="636" y="130" width="140" height="104" rx="6" fill="#fff" />
        <rect x="650" y="144" width="112" height="76" fill="#bde4c8" strokeWidth="3" />
        <path d="M650 210 l30 -30 l24 22 l20 -16 l38 32" fill="#86c5a4" strokeWidth="3" />
        {/* Wandregal */}
        <rect x="420" y="250" width="150" height="14" rx="5" fill="#a16207" />
      </g>
      <Wandlampe an={licht.lampe} />

      {/* Freie Stellplätze */}
      {frei.map((p) => (
        <g key={p} className="zimmer-tippbar" onClick={onFrei} role="button" aria-label="Freier Platz – einrichten" data-platz={p}>
          <FreierPlatz {...PLAETZE[p]} />
        </g>
      ))}

      {/* Möbel – hinten zuerst, damit vorne Liegendes darüber gezeichnet wird */}
      {moebel.has('kuschelhoehle') && <g className={plopp('kuschelhoehle')}><Kuschelhoehle {...PLAETZE.hoehle} /></g>}
      {moebel.has('kratzbaum') && <g className={plopp('kratzbaum')}><Kratzbaum {...PLAETZE.kratzbaum} /></g>}
      {moebel.has('futterautomat') && <g className={plopp('futterautomat')}><Futterautomat {...PLAETZE.napf} /></g>}
      <Napf {...PLAETZE.napf} fuellung={napf} />
      {moebel.has('trinkbrunnen') ? <g className={plopp('trinkbrunnen')}><Trinkbrunnen {...PLAETZE.wasser} /></g> : <Wassernapf {...PLAETZE.wasser} />}
      {moebel.has('katzenklo') && (
        <g className={plopp('katzenklo')}>
          <Katzenklo {...PLAETZE.klo} fuellung={klo} voll={kloVoll} onLeeren={() => onPutzen('klo')} />
        </g>
      )}
      {/* Hinten zuerst, damit vordere Häufchen davor liegen */}
      {[...haeufchen].sort((a, b) => a.y - b.y).map((h) => (
        <Haeufchen key={h.id} x={h.x} y={h.y} onWeg={() => onPutzen(h.id)} />
      ))}

      {geschenk && <Geschenk x={790} y={640} onOeffnen={onGeschenk} />}
      {fund && (
        <g transform="translate(380 652)" className="zimmer-tippbar" onClick={onFund}
           role="button" aria-label="Fundstück aufheben" data-fund={fund}>
          <g className="zimmer-fund">
            <ellipse cx="0" cy="14" rx="22" ry="5" fill="#9c6b3e" opacity="0.3" />
            <FundstueckBild id={fund} />
            <path className="zimmer-funkeln" d="M22 -22 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" fill="#fde047" stroke="#2f2a26" strokeWidth="2" />
          </g>
          <circle r="34" fill="transparent" />
        </g>
      )}

      {/* Die Katze: äussere Ebene läuft, innere schaut in Laufrichtung */}
      <g
        className={`zimmer-katze ${laeuft ? 'laeuft' : ''} ${rollt ? 'rollt' : ''} tut-${art} pose-${pose}`}
        style={{ transform: `translate(${pos.x - KATZE / 2}px, ${pos.y - KATZE + 12}px)`, transitionDuration: `${dauer}ms` }}
        onClick={onKatze}
        role="button"
        aria-label="Katze streicheln"
      >
        <ellipse cx={KATZE / 2} cy={KATZE - 14} rx="52" ry="9" fill="#9c6b3e" opacity="0.3" filter="url(#zimmer-weich)" />
        {/* Spiegeln und Wippen auf getrennten Ebenen – beide brauchen transform */}
        {/* Grösse nach Wachstumsphase: Kitten sind sichtbar kleiner, die Füsse bleiben am Boden */}
        <g className="zimmer-katze-koerper" style={{ transform: `scale(${-richtung * groesse}, ${groesse})` }}>
          <g className="zimmer-katze-hops">
            <svg width={KATZE} height={KATZE} viewBox="0 0 200 200" overflow="visible">
              {/* key={pose}: jeder Posenwechsel federt kurz (pose-ein), statt hart umzuspringen */}
              <g key={pose} className="pose-ein"><KatzePose pose={pose} fell={fell} aktiv={laeuft} zubehoer={zubehoer} /></g>
            </svg>
          </g>
        </g>
        {pose === 'schlafen' && (
          <g className="zimmer-zzz" aria-hidden="true" fill="#6b7280" fontWeight="800" fontFamily="Roboto, system-ui, sans-serif">
            <text x={KATZE * 0.3} y="70" fontSize="22">z</text>
            <text x={KATZE * 0.3} y="70" fontSize="28">Z</text>
            <text x={KATZE * 0.3} y="70" fontSize="34">Z</text>
          </g>
        )}
        <g transform={`translate(${KATZE * 0.62} -58)`}><Gedankenblase was={blase} /></g>
      </g>
      {/* Abend und Nacht: das Zimmer dunkelt ab, die Lampe bleibt hell */}
      {licht.dunkel > 0 && (
        <rect x={-W} y={-W} width={1024 + 2 * W} height={768 + 2 * W} fill="#1e1b4b" opacity={licht.dunkel} pointerEvents="none" className="zimmer-dunkel" />
      )}
    </svg>
  );
}
