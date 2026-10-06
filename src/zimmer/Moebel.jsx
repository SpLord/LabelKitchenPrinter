/*
  Möbel des Katzenzimmers, Stil A "Comic mit Kontur".

  Jedes Möbel zeichnet sich um seinen Ankerpunkt (Mitte der Standfläche,
  siehe einrichtung.js). Formen aus dem freigegebenen Entwurf
  docs/superpowers/specs/katzenzimmer/zimmer.png. Kein Emoji – alles Pfade,
  damit es auf jedem Gerät gleich aussieht.
*/

const KONTUR = '#2f2a26';
const strich = { stroke: KONTUR, strokeWidth: 5, strokeLinejoin: 'round', strokeLinecap: 'round' };

/* Weicher Bodenschatten – aus Variante C geliehen, gibt Tiefe ohne Stilbruch. */
export const Schatten = ({ x, y, rx, ry = rx / 6 }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#9c6b3e" opacity="0.32" filter="url(#zimmer-weich)" />
);

/* Futternapf. fuellung 0–100 bestimmt, wie hoch das Futter liegt. */
export function Napf({ x, y, fuellung = 0 }) {
  const hoehe = fuellung > 0 ? 4 + Math.min(100, fuellung) * 0.14 : 0;
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="napf">
      <Schatten x={0} y={4} rx={46} />
      {hoehe > 0 && (
        <path d={`M-34 -30 Q0 ${-30 - hoehe * 2} 34 -30 Z`} fill="#a16207" strokeWidth={3.5} />
      )}
      <path d="M-42 -30 h84 l-8 30 h-68 Z" fill="#ef4444" />
      <ellipse cx="0" cy="-30" rx="42" ry="8" fill={hoehe > 0 ? '#a16207' : '#7f1d1d'} strokeWidth={4} />
    </g>
  );
}

export function Futterautomat({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="futterautomat">
      <rect x="-30" y="-92" width="60" height="62" rx="10" fill="#fde68a" />
      <rect x="-18" y="-80" width="36" height="24" rx="4" fill="#fff" strokeWidth={3.5} />
      <path d="M-16 -66 h32" stroke="#a16207" strokeWidth={7} />
    </g>
  );
}

export function Wassernapf({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="wassernapf">
      <Schatten x={0} y={4} rx={44} />
      <path d="M-40 -26 h80 l-7 26 h-66 Z" fill="#93c5fd" />
      <ellipse cx="0" cy="-26" rx="40" ry="8" fill="#3b82f6" strokeWidth={4} />
      <path d="M-18 -28 q8 -4 16 0" fill="none" stroke="#dbeafe" strokeWidth={3} />
    </g>
  );
}

export function Trinkbrunnen({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="trinkbrunnen">
      <Schatten x={0} y={4} rx={44} />
      <path d="M-40 0 h80 l-7 -44 h-66 Z" fill="#a7d8f0" />
      <rect x="-16" y="-92" width="32" height="50" rx="8" fill="#e0f2fe" />
      {/* Der Wasserstrahl läuft – das zeigt, dass er funktioniert */}
      <path className="zimmer-strahl" d="M0 -92 q-4 -26 -32 -18" fill="none" stroke="#3b82f6" strokeWidth={6} />
      <ellipse cx="0" cy="-44" rx="33" ry="7" fill="#60a5fa" strokeWidth={4} />
    </g>
  );
}

export function Kratzbaum({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="kratzbaum">
      <Schatten x={0} y={-2} rx={72} />
      <rect x="-64" y="-22" width="128" height="22" rx="7" fill="#a16207" />
      <rect x="-16" y="-290" width="32" height="270" fill="#e7cfa0" />
      <g stroke="#b08a50" strokeWidth={3.5}>
        {[-260, -224, -188, -152, -116, -80, -44].map((h) => (
          <line key={h} x1="-16" y1={h} x2="16" y2={h + 8} />
        ))}
      </g>
      <rect x="-60" y="-308" width="120" height="22" rx="8" fill="#a16207" />
      {/* Schnur und Ball pendeln gemeinsam um das obere Ende der Schnur */}
      <g className="zimmer-pendel">
        <path d="M40 -286 V-256" strokeWidth={3} />
        <circle cx="40" cy="-245" r="11" fill="#f87171" strokeWidth={4} />
      </g>
    </g>
  );
}

export function Kuschelhoehle({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="kuschelhoehle">
      <Schatten x={0} y={4} rx={100} />
      <path d="M-90 0 q0 -110 90 -110 q90 0 90 110 Z" fill="#f9a8b4" />
      <path d="M-42 0 v-34 a42 42 0 0 1 84 0 v34 Z" fill="#7a3b4e" strokeWidth={4} />
      <ellipse cx="0" cy="0" rx="96" ry="14" fill="#f472a0" />
    </g>
  );
}

/* Freier Stellplatz: gestrichelt, damit man sieht, dass hier etwas hinpasst. */
export function FreierPlatz({ x, y, art }) {
  const farbe = '#a0896c';
  return (
    <g transform={`translate(${x} ${y})`} data-platz="frei">
      {art === 'wand'
        ? <rect x="-63" y="-75" width="126" height="68" rx="12" fill="none" stroke={farbe} strokeWidth={3.5} strokeDasharray="10 8" />
        : <ellipse cx="0" cy="-26" rx="74" ry="34" fill="none" stroke={farbe} strokeWidth={3.5} strokeDasharray="10 8" />}
      <text x="0" y={art === 'wand' ? -32 : -16} textAnchor="middle" fontSize="28" fontWeight="800" fill={farbe}
            fontFamily="DejaVu Sans, Arial, sans-serif">+</text>
    </g>
  );
}

/* Gedankenblase über der Katze: zeigt, was ihr fehlt. */
export function Gedankenblase({ was }) {
  if (!was) return null;
  return (
    <g {...strich} strokeWidth={4} className="zimmer-blase">
      <circle cx="4" cy="64" r="5" fill="#fff" />
      <circle cx="16" cy="50" r="8" fill="#fff" />
      <rect x="22" y="0" width="58" height="46" rx="20" fill="#fff" />
      {was === 'durst' && (
        <path d="M51 9 C41 22 39 28 39 32 a12 12 0 0 0 24 0 c0 -4 -2 -10 -12 -23 Z" fill="#60a5fa" strokeWidth={3.5} />
      )}
      {was === 'hunger' && (
        <g strokeWidth={3}><path d="M33 20 h36 l-5 14 h-26 Z" fill="#ef4444" /><ellipse cx="51" cy="20" rx="18" ry="4" fill="#a16207" /></g>
      )}
      {was === 'krank' && (
        <g strokeWidth={3}><rect x="35" y="14" width="32" height="18" rx="6" fill="#fde68a" /><path d="M47 23 h8 M51 19 v8" strokeWidth={2.5} /></g>
      )}
    </g>
  );
}
