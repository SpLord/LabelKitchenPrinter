import KatzePose, { poseFuer } from './KatzePose.jsx';
import { PLAETZE } from './einrichtung.js';
import {
  FreierPlatz, Futterautomat, Gedankenblase, Kratzbaum, Kuschelhoehle, Napf, Trinkbrunnen, Wassernapf,
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
export default function Szene({ moebel, frei, napf, katze, fell, zubehoer, onKatze }) {
  const { pos, richtung, dauer, laeuft, blase, art } = katze;
  const pose = poseFuer({ laeuft, art });
  return (
    <svg className="zimmer-szene" viewBox="0 0 1024 768" preserveAspectRatio="xMidYMid meet"
         role="img" aria-label="Katzenzimmer">
      <defs>
        <filter id="zimmer-weich" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" /></filter>
        <linearGradient id="zimmer-himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fd4f6" /><stop offset="1" stopColor="#d6eefc" /></linearGradient>
      </defs>

      {/* Wand mit Streifentapete */}
      <rect width="1024" height="470" fill="#fbecd6" />
      <g fill="#f4dfc0">{[60, 200, 340, 480, 620, 760, 900].map((x) => <rect key={x} x={x} width="14" height="470" />)}</g>

      {/* Dielenboden */}
      <rect y="466" width="1024" height="302" fill="#e3b88b" />
      <g stroke="#c4935f" strokeWidth="4">
        <line x1="0" y1="520" x2="1024" y2="520" /><line x1="0" y1="580" x2="1024" y2="580" /><line x1="0" y1="646" x2="1024" y2="646" />
        <line x1="180" y1="466" x2="170" y2="520" /><line x1="560" y1="520" x2="550" y2="580" /><line x1="820" y1="580" x2="810" y2="646" />
      </g>
      <rect y="458" width="1024" height="14" fill="#fff" />
      <line x1="0" y1="472" x2="1024" y2="472" stroke={KONTUR} strokeWidth="5" />

      <g stroke={KONTUR} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        {/* Fenster */}
        <rect x="70" y="110" width="200" height="180" rx="10" fill="url(#zimmer-himmel)" />
        <circle cx="226" cy="150" r="20" fill="#fde68a" stroke="none" />
        <path d="M92 168 q14 -16 30 -4 q12 -10 22 4" fill="#fff" strokeWidth="3.5" />
        <path d="M170 110 V290 M70 200 H270" strokeWidth="6" />
        <rect x="58" y="288" width="226" height="18" rx="5" fill="#fff" />
        {/* Bild an der Wand */}
        <rect x="636" y="130" width="140" height="104" rx="6" fill="#fff" />
        <rect x="650" y="144" width="112" height="76" fill="#bde4c8" strokeWidth="3" />
        <path d="M650 210 l30 -30 l24 22 l20 -16 l38 32" fill="#86c5a4" strokeWidth="3" />
        {/* Wandregal */}
        <rect x="420" y="250" width="150" height="14" rx="5" fill="#a16207" />
      </g>

      {/* Freie Stellplätze */}
      {frei.map((p) => <FreierPlatz key={p} {...PLAETZE[p]} />)}

      {/* Möbel – hinten zuerst, damit vorne Liegendes darüber gezeichnet wird */}
      {moebel.has('kuschelhoehle') && <Kuschelhoehle {...PLAETZE.hoehle} />}
      {moebel.has('kratzbaum') && <Kratzbaum {...PLAETZE.kratzbaum} />}
      {moebel.has('futterautomat') && <Futterautomat {...PLAETZE.napf} />}
      <Napf {...PLAETZE.napf} fuellung={napf} />
      {moebel.has('trinkbrunnen') ? <Trinkbrunnen {...PLAETZE.wasser} /> : <Wassernapf {...PLAETZE.wasser} />}

      {/* Die Katze: äussere Ebene läuft, innere schaut in Laufrichtung */}
      <g
        className={`zimmer-katze ${laeuft ? 'laeuft' : ''} tut-${art} pose-${pose}`}
        style={{ transform: `translate(${pos.x - KATZE / 2}px, ${pos.y - KATZE + 12}px)`, transitionDuration: `${dauer}ms` }}
        onClick={onKatze}
        role="button"
        aria-label="Katze streicheln"
      >
        <ellipse cx={KATZE / 2} cy={KATZE - 14} rx="52" ry="9" fill="#9c6b3e" opacity="0.3" filter="url(#zimmer-weich)" />
        {/* Spiegeln und Wippen auf getrennten Ebenen – beide brauchen transform */}
        <g className="zimmer-katze-koerper" style={{ transform: `scaleX(${-richtung})` }}>
          <g className="zimmer-katze-hops">
            <svg width={KATZE} height={KATZE} viewBox="0 0 200 200" overflow="visible">
              <KatzePose pose={pose} fell={fell} aktiv={laeuft} zubehoer={zubehoer} />
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
    </svg>
  );
}
