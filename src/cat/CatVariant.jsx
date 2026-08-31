/*
  Aussehen der Katze als SVG.
  Rein darstellend, ohne Zustand – deshalb aus CatSprite herausgelöst.

  Die Bewegung (Schwanz, Ohren, Augen, Pfoten) liegt bewusst in styles.css
  und nicht mehr als SMIL im Markup: SMIL lief im Hauptthread und kostete
  gemessen rund ein Drittel der Bildrate.
*/
const VARIANTS = [
  { name: 'sand', body: '#f5d3b3', stroke: '#3b3b3b', accent: '#e08e79', pattern: 'none' },
  { name: 'creme', body: '#f2e5cf', stroke: '#2f2f2f', accent: '#f59e0b', pattern: 'none' },
  { name: 'blau', body: '#c7e0ff', stroke: '#1f2937', accent: '#60a5fa', pattern: 'stripes', patternColor: '#60a5fa' },
  { name: 'rosa', body: '#ffd6e7', stroke: '#334155', accent: '#fb7185', pattern: 'spots', patternColor: '#fb7185' },
  { name: 'ginger', body: '#fbbf24', stroke: '#3b2f17', accent: '#f59e0b', pattern: 'stripes', patternColor: '#d97706' },
  { name: 'gray', body: '#cbd5e1', stroke: '#0f172a', accent: '#94a3b8', pattern: 'none' },
  { name: 'tuxedo', body: '#111827', stroke: '#000000', accent: '#f3f4f6', pattern: 'tuxedo', patternColor: '#f3f4f6' },
  { name: 'siam', body: '#e5d3b3', stroke: '#3b3b3b', accent: '#8b5e34', pattern: 'siam', patternColor: '#8b5e34' },
  { name: 'calico', body: '#fff7ed', stroke: '#374151', accent: '#fb923c', pattern: 'patch', patternColor: '#fb923c' },
  { name: 'snow', body: '#f8fafc', stroke: '#334155', accent: '#a3e635', pattern: 'spots', patternColor: '#a3e635' },
];

function CatVariant({ index, active, zubehoer = {} }) {
  const v = VARIANTS[index % VARIANTS.length];
  const earTilt = index % 2 === 0 ? '' : 'rotate(-6 60 40)';
  const earTiltR = index % 2 === 0 ? '' : 'rotate(6 120 42)';
  // Blinzeln pro Katze leicht versetzt, damit nicht alle im Gleichtakt zwinkern
  const blinkDelay = `${-(index % 5) * 1.3}s`;
  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      className={`cat-svg ${active ? 'aktiv' : ''}`}
      style={{ '--blink-delay': blinkDelay }}
    >
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>
      <path className="cat-tail" d="M158 118 c34 -6 52 16 40 40 s-34 14-44 2" fill="none" stroke={v.stroke} strokeWidth="8" strokeLinecap="round" />
      <g filter="url(#shadow)">
        {/* Body + Head */}
        <ellipse cx="110" cy="120" rx="70" ry="55" fill={v.body} stroke={v.stroke} strokeWidth="6" />
        <circle cx="80" cy="85" r="40" fill={v.body} stroke={v.stroke} strokeWidth="6" />
        {/* Ears */}
        <path className="cat-ear cat-ear-l" d="M55 56 L45 25 L75 45 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" transform={earTilt} />
        <path className="cat-ear cat-ear-r" d="M105 56 L135 25 L125 60 Z" fill={v.body} stroke={v.stroke} strokeWidth="6" transform={earTiltR} />

        {/* Patterns */}
        {v.pattern === 'stripes' && (
          <g stroke={v.patternColor} strokeWidth="4" opacity="0.55" strokeLinecap="round">
            <path d="M120 95 q-16 10 -32 0" fill="none" />
            <path d="M130 115 q-22 12 -44 0" fill="none" />
            <path d="M95 70 q-8 6 -16 0" fill="none" />
          </g>
        )}
        {v.pattern === 'spots' && (
          <g fill={v.patternColor} opacity="0.5">
            <circle cx="120" cy="110" r="10" />
            <circle cx="95" cy="130" r="8" />
            <circle cx="70" cy="78" r="6" />
          </g>
        )}
        {v.pattern === 'tuxedo' && (
          <path d="M110 80 q-40 50 0 80 q40-30 0-80" fill={v.patternColor} opacity="0.95" />
        )}
        {v.pattern === 'siam' && (
          <g fill={v.patternColor} opacity="0.65">
            <path d="M55 56 L45 25 L75 45 Z" />
            <path d="M105 56 L135 25 L125 60 Z" />
            <ellipse cx="60" cy="155" rx="16" ry="10" />
            <ellipse cx="95" cy="165" rx="16" ry="10" />
          </g>
        )}
        {v.pattern === 'patch' && (
          <g fill={v.patternColor} opacity="0.6">
            <path d="M78 60 q-16 8 -10 22 q16-6 10-22" />
            <path d="M130 130 q-20 10 -8 24 q18-8 8-24" />
          </g>
        )}

        {/* Eyes / Face */}
        <circle className="cat-eye cat-eye-l" cx="65" cy="85" r="6" fill={v.stroke} />
        <circle className="cat-eye cat-eye-r" cx="95" cy="85" r="6" fill={v.stroke} />
        <polygon points="80,95 75,103 85,103" fill={v.accent} />
        <path d="M75 108 q5 6 10 0" stroke={v.stroke} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M52 95 h18 M52 103 h18 M52 87 h18" stroke={v.stroke} strokeWidth="4" strokeLinecap="round" />
        <path d="M90 95 h18 M90 103 h18 M90 87 h18" stroke={v.stroke} strokeWidth="4" strokeLinecap="round" />

        {/* Gekauftes Zubehör aus dem Katzenladen. Kopf: Kreis bei 80/85 r=40,
            Augen bei 65/85 und 95/85, Ohren oben zwischen y 25 und 60. */}
        {zubehoer.halsband && (
          <g className="kz-halsband">
            <path d="M52 116 q28 16 56 0" fill="none" stroke={v.accent} strokeWidth="9" strokeLinecap="round" />
            <circle cx="80" cy="126" r="6" fill="#fbbf24" stroke={v.stroke} strokeWidth="2.5" />
          </g>
        )}
        {zubehoer.brille && (
          <g className="kz-brille" fill="none" stroke={v.stroke} strokeWidth="4">
            <circle cx="65" cy="85" r="13" fill="rgba(255,255,255,0.35)" />
            <circle cx="95" cy="85" r="13" fill="rgba(255,255,255,0.35)" />
            <path d="M78 85 h4" strokeLinecap="round" />
            <path d="M52 82 l-9 -4" strokeLinecap="round" />
          </g>
        )}
        {zubehoer.schal && (
          <g className="kz-schal">
            <path d="M48 118 q32 20 64 2 l3 12 q-34 19 -70 -2 Z" fill="#ef4444" stroke={v.stroke} strokeWidth="4" strokeLinejoin="round" />
            <path d="M104 132 l10 26 l-13 4 l-6 -26 Z" fill="#dc2626" stroke={v.stroke} strokeWidth="4" strokeLinejoin="round" />
          </g>
        )}
        {zubehoer.hut && (
          <g className="kz-hut">
            <path d="M46 40 h60" stroke={v.stroke} strokeWidth="6" strokeLinecap="round" />
            <rect x="58" y="6" width="36" height="34" rx="3" fill="#1f2937" stroke={v.stroke} strokeWidth="5" />
            <rect x="58" y="28" width="36" height="8" fill="#dc2626" />
          </g>
        )}
        {zubehoer.schleife && (
          <g className="kz-schleife">
            <path d="M112 44 l-16 -10 v20 Z" fill="#fb7185" stroke={v.stroke} strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M112 44 l16 -10 v20 Z" fill="#fb7185" stroke={v.stroke} strokeWidth="3.5" strokeLinejoin="round" />
            <circle cx="112" cy="44" r="5" fill="#f43f5e" stroke={v.stroke} strokeWidth="3" />
          </g>
        )}

        {/* Paws */}
        <ellipse className="cat-paw cat-paw-1" cx="60" cy="155" rx="16" ry="10" fill={v.body} stroke={v.stroke} strokeWidth="6" />
        <ellipse className="cat-paw cat-paw-2" cx="95" cy="165" rx="16" ry="10" fill={v.body} stroke={v.stroke} strokeWidth="6" />
      </g>
    </svg>
  );
}



export default CatVariant;
export { VARIANTS };
