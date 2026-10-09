import { useId } from 'react';
import CatVariant, { ZubehoerKopf } from '../cat/CatVariant.jsx';
import { VARIANTS } from '../cat/felle.js';

/*
  Posen der Katze im Zimmer (Etappe 2, Entwurf effekte.png Reihe 1).

  Vorher rutschte die Katze in ihrer Sitz-Zeichnung durchs Zimmer – egal ob
  sie lief, frass oder schlief. Krank oder schlafend sah sie aus wie immer.

  Alle Posen im selben 200 × 200-Feld wie die sitzende Katze, Füsse unten bei
  y ≈ 176, Blick nach LINKS (gespiegelt wird in der Szene).

  Fell: Körperfarbe, Kontur und Akzent aus felle.js. Muster werden auf den
  Körper der jeweiligen Pose zugeschnitten (clipPath), damit Streifen und
  Flecken nicht aus der Form fallen.

  Zubehör: Kopf- und Halsstücke aus CatVariant, per transform auf den Kopf
  der Pose gesetzt. Kopf der Sitz-Zeichnung: Mitte 80/85, Radius 40.
  Flügel und Umhang trägt sie in Etappe 2 nur im Sitzen.
*/

const kopfAuf = (cx, cy, r, drehen = 0) => {
  const s = r / 40;
  return `translate(${cx} ${cy}) rotate(${drehen}) scale(${s}) translate(-80 -85)`;
};

/* Muster, zugeschnitten auf die Körperform der Pose. */
function Muster({ v, clipId, koerper }) {
  const { pattern, patternColor: c } = v;
  if (!pattern || pattern === 'none') return null;
  const { cx, cy, rx } = koerper;
  return (
    <g clipPath={`url(#${clipId})`} pointerEvents="none">
      {pattern === 'stripes' && (
        <g stroke={c} strokeWidth="6" opacity="0.55" strokeLinecap="round" fill="none">
          <path d={`M${cx - rx * 0.4} ${cy - 40} q-10 30 0 60`} />
          <path d={`M${cx} ${cy - 40} q-10 30 0 60`} />
          <path d={`M${cx + rx * 0.4} ${cy - 40} q-10 30 0 60`} />
        </g>
      )}
      {(pattern === 'spots' || pattern === 'patch') && (
        <g fill={c} opacity={pattern === 'patch' ? 0.65 : 0.5}>
          <circle cx={cx - rx * 0.3} cy={cy - 6} r={pattern === 'patch' ? 16 : 9} />
          <circle cx={cx + rx * 0.35} cy={cy + 4} r={pattern === 'patch' ? 13 : 8} />
        </g>
      )}
      {pattern === 'tuxedo' && <ellipse cx={cx - rx * 0.15} cy={cy + 18} rx={rx * 0.55} ry="16" fill={c} />}
      {pattern === 'glanz' && <ellipse cx={cx - rx * 0.2} cy={cy - 12} rx={rx * 0.45} ry="8" fill={c} opacity="0.55" />}
      {pattern === 'sterne' && (
        <g fill={c}>
          <circle cx={cx - rx * 0.4} cy={cy - 8} r="3" /><circle cx={cx + rx * 0.1} cy={cy + 6} r="2.5" />
          <circle cx={cx + rx * 0.5} cy={cy - 10} r="2" /><circle cx={cx - rx * 0.05} cy={cy - 16} r="2" />
        </g>
      )}
    </g>
  );
}

/* Gesicht im Profil (nach links): Auge(n), Nase, Schnurrhaare. */
function Gesicht({ v, cx, cy, r, zu = false, matt = false }) {
  const s = r / 33;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} stroke={v.stroke} strokeLinecap="round">
      {zu ? (
        <g fill="none" strokeWidth="3.5"><path d="M-20 -2 q5 5 10 0" /><path d="M0 0 q5 5 10 0" /></g>
      ) : matt ? (
        <g strokeWidth="3.5"><path d="M-21 -2 h9" /><path d="M-1 0 h9" /></g>
      ) : (
        <g fill={v.stroke} stroke="none" className="pose-augen"><circle cx="-16" cy="-2" r="5" /><circle cx="4" cy="0" r="5" /></g>
      )}
      <polygon points="-30,8 -24,12 -30,15" fill={v.accent} stroke="none" />
      <g strokeWidth="2.5" fill="none" opacity="0.9"><path d="M-30 18 h-14 M-28 24 h-12" /></g>
    </g>
  );
}

/* Laufen und Jagen: Seitenansicht, Beine schwingen per CSS (zimmer.css). */
function Laufen({ v, clipId }) {
  const k = { cx: 112, cy: 112, rx: 60, ry: 30 };
  const bein = (x, cls) => (
    <rect className={`pose-bein ${cls}`} x={x} y="118" width="15" height="52" rx="7.5" fill={v.body} stroke={v.stroke} strokeWidth="5" />
  );
  return (
    <>
      <defs><clipPath id={clipId}><ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} /></clipPath></defs>
      <path className="pose-schwanz" d="M166 104 C196 82 192 48 174 52" fill="none" stroke={v.stroke} strokeWidth="9" strokeLinecap="round" />
      {bein(76, 'hinten-a')}{bein(140, 'hinten-b')}
      <ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} fill={v.body} stroke={v.stroke} strokeWidth="6" />
      <Muster v={v} clipId={clipId} koerper={k} />
      {bein(92, 'vorn-a')}{bein(156, 'vorn-b')}
      <circle cx="54" cy="84" r="33" fill={v.body} stroke={v.stroke} strokeWidth="6" />
      <path d="M36 62 L30 30 L56 52 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <path d="M62 54 L78 26 L84 60 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <Gesicht v={v} cx={54} cy={84} r={33} />
    </>
  );
}

/* Fressen und Trinken: steht, Kopf gesenkt zum Napf. */
function Fressen({ v, clipId }) {
  const k = { cx: 118, cy: 110, rx: 58, ry: 30 };
  return (
    <>
      <defs><clipPath id={clipId}><ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} /></clipPath></defs>
      <path className="pose-schwanz" d="M170 102 C198 92 200 62 184 60" fill="none" stroke={v.stroke} strokeWidth="9" strokeLinecap="round" />
      {[84, 146].map((x) => <rect key={x} x={x} y="116" width="15" height="56" rx="7.5" fill={v.body} stroke={v.stroke} strokeWidth="5" />)}
      <ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} fill={v.body} stroke={v.stroke} strokeWidth="6" />
      <Muster v={v} clipId={clipId} koerper={k} />
      {[100, 162].map((x) => <rect key={x} x={x} y="118" width="15" height="56" rx="7.5" fill={v.body} stroke={v.stroke} strokeWidth="5" />)}
      <g className="pose-kopf-frisst">
        <circle cx="50" cy="136" r="30" fill={v.body} stroke={v.stroke} strokeWidth="6" />
        <path d="M34 116 L26 88 L52 108 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
        <path d="M58 110 L74 84 L78 116 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
        <Gesicht v={v} cx={50} cy={136} r={30} zu />
      </g>
    </>
  );
}

/* Schlafen: eingerollt, Augen zu, atmet langsam. */
function Schlafen({ v, clipId }) {
  const k = { cx: 112, cy: 150, rx: 66, ry: 28 };
  return (
    <>
      <defs><clipPath id={clipId}><ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} /></clipPath></defs>
      <path d="M170 140 C198 130 198 102 180 98" fill="none" stroke={v.stroke} strokeWidth="9" strokeLinecap="round" />
      <g className="pose-atmen">
        <ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} fill={v.body} stroke={v.stroke} strokeWidth="6" />
        <Muster v={v} clipId={clipId} koerper={k} />
      </g>
      <circle cx="62" cy="146" r="27" fill={v.body} stroke={v.stroke} strokeWidth="6" />
      <path d="M44 128 L38 104 L60 120 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <path d="M68 120 L82 98 L86 128 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <Gesicht v={v} cx={62} cy={146} r={27} zu />
    </>
  );
}

/* Krank: liegt flach, blasser, Ohren hängen, Pflaster auf dem Kopf. */
function Krank({ v, clipId }) {
  // Blasser: Fell mit Grau gemischt
  const blass = { ...v, body: `color-mix(in srgb, ${v.body} 55%, #d1d5db)` };
  const k = { cx: 118, cy: 156, rx: 64, ry: 24 };
  return (
    <>
      <defs><clipPath id={clipId}><ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} /></clipPath></defs>
      <path d="M180 162 q22 2 26 -8" fill="none" stroke={v.stroke} strokeWidth="8" strokeLinecap="round" />
      <ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} fill={blass.body} stroke={v.stroke} strokeWidth="6" />
      <Muster v={v} clipId={clipId} koerper={k} />
      <path d="M40 132 L34 110 L58 124 Z" fill={blass.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <path d="M68 126 L88 112 L86 138 Z" fill={blass.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="56" cy="152" r="30" fill={blass.body} stroke={v.stroke} strokeWidth="6" />
      <Gesicht v={v} cx={56} cy={154} r={30} matt />
      <rect x="54" y="124" width="30" height="11" rx="4" fill="#fde68a" stroke={v.stroke} strokeWidth="3" transform="rotate(24 69 129)" />
      <path d="M98 128 c-4 6 -4 9 0 11 c4 -2 4 -5 0 -11 Z" fill="#93c5fd" stroke={v.stroke} strokeWidth="2" />
    </>
  );
}

/* Strecken (2.3.0): vorne tief, hinten hoch, Schwanz in die Luft. */
function Strecken({ v, clipId }) {
  const k = { cx: 116, cy: 124, rx: 58, ry: 26 };
  return (
    <>
      <defs><clipPath id={clipId}><ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} transform={`rotate(-16 ${k.cx} ${k.cy})`} /></clipPath></defs>
      <path className="pose-schwanz" d="M164 100 C182 64 176 34 160 30" fill="none" stroke={v.stroke} strokeWidth="9" strokeLinecap="round" />
      {/* Hinterbeine senkrecht, Vorderbeine lang nach vorn gestreckt */}
      <rect x="140" y="112" width="15" height="62" rx="7.5" fill={v.body} stroke={v.stroke} strokeWidth="5" />
      <path d="M84 146 L8 166 L10 177 L90 160 Z" fill={v.body} stroke={v.stroke} strokeWidth="5" strokeLinejoin="round" />
      <g className="pose-dehnen">
        <ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} transform={`rotate(-16 ${k.cx} ${k.cy})`} fill={v.body} stroke={v.stroke} strokeWidth="6" />
        <Muster v={v} clipId={clipId} koerper={k} />
      </g>
      <rect x="156" y="110" width="15" height="64" rx="7.5" fill={v.body} stroke={v.stroke} strokeWidth="5" />
      <path d="M92 152 L18 170 L20 180 L98 166 Z" fill={v.body} stroke={v.stroke} strokeWidth="5" strokeLinejoin="round" />
      <path d="M50 106 L42 80 L68 98 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <path d="M76 100 L92 76 L96 108 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="68" cy="126" r="30" fill={v.body} stroke={v.stroke} strokeWidth="6" />
      <Gesicht v={v} cx={68} cy={128} r={30} zu />
    </>
  );
}

/*
  Gähnen und Putzen (2.3.0): die sitzende Zeichnung (CatVariant) mit einer
  Ebene darüber – Augen zu, Maul auf bzw. Pfote zum Maul. Koordinaten der
  Sitzkatze: Kopf 80/85 r40, Augen 65/85 und 95/85, Maul um 80/105.
*/
function SitzEbene({ v, art }) {
  const lid = (x) => <g key={x}><ellipse cx={x} cy="85" rx="8" ry="7" fill={v.body} /><path d={`M${x - 7} 85 q7 5 14 0`} fill="none" stroke={v.stroke} strokeWidth="3.5" strokeLinecap="round" /></g>;
  return (
    <g pointerEvents="none">
      {art !== 'tatze' && [65, 95].map(lid)}
      {art === 'gaehnen' && (
        <g className="pose-gaehnen">
          <ellipse cx="80" cy="107" rx="9" ry="11" fill="#7f1d1d" stroke={v.stroke} strokeWidth="3" />
          <ellipse cx="80" cy="112" rx="5" ry="4" fill="#f9a8b4" />
        </g>
      )}
      {/* Treteln (2.7.0): Vorderpfoten drücken abwechselnd, Augen selig zu */}
      {art === 'treteln' && (
        <g>
          <ellipse className="pose-tritt eins" cx="60" cy="155" rx="17" ry="11" fill={v.body} stroke={v.stroke} strokeWidth="6" />
          <ellipse className="pose-tritt zwei" cx="95" cy="165" rx="17" ry="11" fill={v.body} stroke={v.stroke} strokeWidth="6" />
          <path d="M74 106 q6 5 12 0" fill="none" stroke={v.stroke} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {/* Tatze (2.7.0): eine Pfote schlägt nach der Fliege */}
      {art === 'tatze' && (
        <ellipse className="pose-tatze" cx="44" cy="118" rx="14" ry="10" fill={v.body} stroke={v.stroke} strokeWidth="5" transform="rotate(-50 44 118)" />
      )}
      {art === 'putzen' && (
        <g className="pose-putzen">
          <path d="M80 108 q3 6 0 9 q-3 -3 0 -9" fill="#f9a8b4" stroke={v.stroke} strokeWidth="2" />
          <ellipse cx="72" cy="114" rx="13" ry="10" fill={v.body} stroke={v.stroke} strokeWidth="5" transform="rotate(-30 72 114)" />
        </g>
      )}
    </g>
  );
}

/* Wo der Kopf in welcher Pose sitzt – für das Zubehör (Mitte, Radius, Neigung). */
const KOEPFE = {
  laufen: [54, 84, 33, 0],
  fressen: [50, 136, 30, -8],
  schlafen: [62, 146, 27, -6],
  krank: [56, 152, 30, -10],
  strecken: [68, 126, 30, -8],
};
const POSEN = { laufen: Laufen, fressen: Fressen, schlafen: Schlafen, krank: Krank, strecken: Strecken };

/* Welche Pose zu welcher Tätigkeit gehört. */
export const poseFuer = ({ laeuft, art }) => {
  if (laeuft) return 'laufen';
  if (art === 'liegen') return 'krank';
  if (art === 'schlafen') return 'schlafen';
  if (art === 'fressen' || art === 'trinken') return 'fressen';
  if (art === 'putzen' || art === 'gaehnen' || art === 'strecken' || art === 'treteln') return art;
  if (art === 'schwanzjagd' || art === 'rennen') return 'laufen';
  if (art === 'fliege') return 'tatze';
  if (art === 'sonnen') return 'schlafen';
  if (art === 'raekeln') return 'strecken';
  return 'sitzen';
};

export default function KatzePose({ pose, fell, zubehoer, aktiv }) {
  const clipId = `pose-${useId().replace(/:/g, '')}`;
  if (pose === 'putzen' || pose === 'gaehnen' || pose === 'treteln' || pose === 'tatze') {
    const v = VARIANTS[fell % VARIANTS.length];
    return (
      <svg viewBox="0 0 200 200" width="100%" height="100%" className={`katze-pose pose-${pose}`} overflow="visible">
        <CatVariant index={fell} active={false} zubehoer={zubehoer} />
        <SitzEbene v={v} art={pose} />
      </svg>
    );
  }
  if (pose === 'sitzen' || !POSEN[pose]) {
    return <CatVariant index={fell} active={aktiv} zubehoer={zubehoer} />;
  }
  const v = VARIANTS[fell % VARIANTS.length];
  const Pose = POSEN[pose];
  const [kx, ky, kr, kd] = KOEPFE[pose];
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" className={`katze-pose pose-${pose}`} overflow="visible">
      <Pose v={v} clipId={clipId} />
      <g transform={kopfAuf(kx, ky, kr, kd)}><ZubehoerKopf zubehoer={zubehoer} v={v} /></g>
    </svg>
  );
}
