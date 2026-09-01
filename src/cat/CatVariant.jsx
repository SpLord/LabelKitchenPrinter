import { VARIANTS } from './felle.js';

/*
  Aussehen der Katze als SVG.
  Rein darstellend, ohne Zustand – deshalb aus CatSprite herausgelöst.

  Die Bewegung (Schwanz, Ohren, Augen, Pfoten) liegt bewusst in styles.css
  und nicht mehr als SMIL im Markup: SMIL lief im Hauptthread und kostete
  gemessen rund ein Drittel der Bildrate.
*/


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

      {/* Der Umhang gehört HINTER den Körper – deshalb steht er vor der
          Körpergruppe im Markup. Als Zubehör weiter unten gezeichnet läge er
          über der Katze und sähe aufgeklebt aus. */}
      {zubehoer.umhang && (
        <g className="kz-umhang">
          <path d="M96 94 C158 100 194 132 199 192 C150 199 104 176 86 126 Z"
                fill="#b91c1c" stroke={v.stroke} strokeWidth="5" strokeLinejoin="round" />
        </g>
      )}

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
        {v.pattern === 'glanz' && (
          <g fill={v.patternColor} opacity="0.55">
            <ellipse cx="95" cy="100" rx="26" ry="12" transform="rotate(-18 95 100)" />
            <ellipse cx="140" cy="128" rx="16" ry="7" transform="rotate(-18 140 128)" />
            <circle cx="66" cy="68" r="5" />
          </g>
        )}
        {v.pattern === 'sterne' && (
          <g fill={v.patternColor}>
            <circle cx="122" cy="104" r="3.5" opacity="0.95" />
            <circle cx="146" cy="126" r="2.5" opacity="0.8" />
            <circle cx="104" cy="140" r="3" opacity="0.9" />
            <circle cx="160" cy="108" r="2" opacity="0.7" />
            <circle cx="128" cy="152" r="2" opacity="0.75" />
            <circle cx="64" cy="66" r="2.5" opacity="0.85" />
            <path d="M92 112 l2.6 5.6 l6 .8 l-4.4 4.3 l1.1 6 l-5.3 -2.9 l-5.3 2.9 l1.1 -6 l-4.4 -4.3 l6 -.8 Z" opacity="0.95" />
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
        {/*
          Angelegter Flügel auf der Flanke, bewusst VOR dem Körper.

          Zwei Versuche dahinter scheiterten am Platz: seitlich verdeckt die
          Körperellipse fast alles, und über den Ohren sahen zwei Spitzen aus
          wie ein zweites Ohrenpaar. Ein angelegter Flügel auf dem Rumpf ist
          das, was eine sitzende Katze mit Flügeln ohnehin zeigen würde.
        */}
        {zubehoer.fluegel && (
          <g className="kz-fluegel">
            <path d="M104 98 C146 94 176 118 169 156 C134 155 108 130 101 105 Z"
                  fill="#c7d2fe" stroke={v.stroke} strokeWidth="4.5" strokeLinejoin="round" />
            <g fill="none" stroke={v.stroke} strokeWidth="3" opacity="0.5" strokeLinecap="round">
              <path d="M112 106 C138 108 158 124 163 148" />
              <path d="M108 118 C130 122 148 136 154 153" />
              <path d="M105 130 C122 135 134 143 141 154" />
            </g>
          </g>
        )}
        {/* Der Kragen gehört vor den Körper – der Stoff dahinter ist zu
            grossen Teilen verdeckt, erst der Kragen macht den Umhang lesbar. */}
        {zubehoer.umhang && (
          <g className="kz-umhang-kragen">
            <path d="M50 112 q30 20 60 -2 l5 13 q-34 24 -70 0 Z"
                  fill="#dc2626" stroke={v.stroke} strokeWidth="4" strokeLinejoin="round" />
            <circle cx="80" cy="122" r="5.5" fill="#fbbf24" stroke={v.stroke} strokeWidth="2.5" />
          </g>
        )}
        {zubehoer.kopfhoerer && (
          <g className="kz-kopfhoerer">
            <path d="M44 84 q0 -46 36 -46 q36 0 36 46" fill="none" stroke="#1f2937" strokeWidth="7" strokeLinecap="round" />
            <rect x="34" y="72" width="18" height="26" rx="7" fill="#374151" stroke={v.stroke} strokeWidth="3.5" />
            <rect x="108" y="72" width="18" height="26" rx="7" fill="#374151" stroke={v.stroke} strokeWidth="3.5" />
            <rect x="37" y="79" width="12" height="12" rx="4" fill="#f472b6" />
          </g>
        )}
        {zubehoer.heiligenschein && (
          <g className="kz-heiligenschein">
            <ellipse cx="80" cy="16" rx="27" ry="8" fill="none" stroke="#fbbf24" strokeWidth="6" />
            <ellipse cx="80" cy="16" rx="27" ry="8" fill="none" stroke="#fef3c7" strokeWidth="2" />
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
