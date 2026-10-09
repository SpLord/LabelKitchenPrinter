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

/*
  Füllanzeige vorne am Napf (2.5.0): vier Stufen, je 25 %. Vorher sah man
  kaum, was noch drin ist.
*/
const Stufen = ({ fuellung, an, aus }) => {
  const voll = fuellung <= 0 ? 0 : Math.ceil(Math.min(100, fuellung) / 25);
  return (
    <g data-stufen={voll}>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-27 + i * 14} y="-18" width="12" height="9" rx="4"
              fill={i < voll ? an : aus} strokeWidth={2} />
      ))}
    </g>
  );
};

/* Kroketten im Napf – je voller, desto mehr und desto höher gehäuft. */
const KROKETTEN = [[-22, 0], [-8, -2], [8, 0], [22, -1], [-15, -6], [0, -7], [15, -6], [-6, -12], [8, -12], [0, -17]];

/*
  Futternapf, schräg von oben: man sieht hinein. fuellung 0–100 bestimmt,
  wie viel Futter darin liegt; leer zeigt den Boden mit zwei Krümeln.
*/
export function Napf({ x, y, fuellung = 0, onTipp }) {
  const f = Math.max(0, Math.min(100, fuellung));
  const anzahl = Math.ceil(f / 10);
  const huegel = f * 0.22;
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`} {...strich} data-moebel="napf" data-fuellung={Math.round(f)}
       className={onTipp ? 'zimmer-tippbar' : undefined} onClick={onTipp} role={onTipp ? 'button' : undefined}
       aria-label={onTipp ? `Futternapf, ${Math.round(f)} % voll – füttern` : undefined}>
      <Schatten x={0} y={4} rx={50} />
      <path d="M-48 -34 h96 l-10 34 h-76 Z" fill="#ef4444" />
      <ellipse cx="0" cy="-34" rx="48" ry="13" fill="#991b1b" strokeWidth={4} />
      {f > 0 ? (
        <g>
          <path d={`M-40 -33 Q0 ${-33 - huegel * 2} 40 -33 Q0 -24 -40 -33 Z`} fill="#b45309" strokeWidth={3} />
          <g fill="#d97706" stroke="#7c2d12" strokeWidth={1.5}>
            {KROKETTEN.slice(0, anzahl).map(([kx, ky]) => (
              <ellipse key={`${kx}${ky}`} cx={kx} cy={-33 + ky * (huegel / 16)} rx="5" ry="3.5" />
            ))}
          </g>
        </g>
      ) : (
        <g fill="#7c2d12" stroke="none"><circle cx="-10" cy="-33" r="2" /><circle cx="12" cy="-31" r="2" /></g>
      )}
      <path d="M-30 -24 h60" stroke="#fca5a5" strokeWidth={3} />
      <Stufen fuellung={f} an="#fde68a" aus="#7f1d1d" />
      {onTipp && <rect x="-56" y="-62" width="112" height="68" fill="transparent" stroke="none" />}
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

/*
  Wasserschale, schräg von oben (2.5.0): der Wasserspiegel sinkt mit jedem
  Trinkgang, leer sieht man den trockenen Boden. Antippen füllt sie auf.
*/
export function Wassernapf({ x, y, fuellung = 100, onTipp }) {
  const f = Math.max(0, Math.min(100, fuellung));
  const tiefe = (1 - f / 100) * 9;       // Wasserspiegel sinkt in die Schale
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`} {...strich} data-moebel="wassernapf" data-fuellung={Math.round(f)}
       className={onTipp ? 'zimmer-tippbar' : undefined} onClick={onTipp} role={onTipp ? 'button' : undefined}
       aria-label={onTipp ? `Wasserschale, ${Math.round(f)} % voll – auffüllen` : undefined}>
      <Schatten x={0} y={4} rx={48} />
      <path d="M-46 -32 h92 l-9 32 h-74 Z" fill="#93c5fd" />
      <ellipse cx="0" cy="-32" rx="46" ry="12" fill={f > 0 ? '#bfdbfe' : '#e2e8f0'} strokeWidth={4} />
      {f > 0 ? (
        <g>
          <ellipse cx="0" cy={-32 + tiefe} rx={40 - tiefe * 1.2} ry={9 - tiefe * 0.35} fill="#3b82f6" strokeWidth={2.5} />
          <path className="zimmer-glitzer" d={`M-16 ${-34 + tiefe} q8 -3 16 0`} fill="none" stroke="#dbeafe" strokeWidth={3} />
        </g>
      ) : (
        <path d="M-6 -36 c-5 7 -5 10 0 12 c5 -2 5 -5 0 -12 Z" fill="#cbd5e1" strokeWidth={2} />
      )}
      <Stufen fuellung={f} an="#3b82f6" aus="#e0f2fe" />
      {onTipp && <rect x="-54" y="-58" width="108" height="64" fill="transparent" stroke="none" />}
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
/* Gestank: drei Wellenlinien, die aufsteigen (zimmer.css). */
const Gestank = ({ x, y }) => (
  <g className="zimmer-gestank" fill="none" stroke="#84cc16" strokeWidth={3.5} strokeLinecap="round" opacity="0.85">
    <path d={`M${x - 12} ${y} q-6 -8 0 -16 q6 -8 0 -16`} />
    <path d={`M${x} ${y - 4} q-6 -8 0 -16 q6 -8 0 -16`} />
    <path d={`M${x + 12} ${y} q-6 -8 0 -16 q6 -8 0 -16`} />
  </g>
);

/*
  Katzenklo. fuellung = Gänge seit dem letzten Leeren (0 … voll). Je Gang
  liegt ein Klümpchen im Streu; volles Klo stinkt sichtbar. Antippen leert es.
*/
export function Katzenklo({ x, y, fuellung = 0, voll = false, onLeeren }) {
  const klumpen = [[-24, -30], [10, -33], [30, -28]].slice(0, fuellung);
  const tippbar = fuellung > 0;
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="katzenklo"
       className={tippbar ? 'zimmer-tippbar' : undefined}
       onClick={tippbar ? onLeeren : undefined}
       role={tippbar ? 'button' : undefined}
       aria-label={tippbar ? 'Katzenklo leeren' : undefined}>
      <Schatten x={0} y={4} rx={64} />
      <path d="M-60 -34 h120 l-8 34 h-104 Z" fill="#5eead4" />
      <ellipse cx="0" cy="-34" rx="60" ry="10" fill="#e7d3a8" strokeWidth={4} />
      <g fill="#cdb489" stroke="none">
        <circle cx="-34" cy="-35" r="2" /><circle cx="-8" cy="-31" r="2" /><circle cx="22" cy="-36" r="2" /><circle cx="40" cy="-32" r="2" />
      </g>
      {klumpen.map(([kx, ky]) => <ellipse key={kx} cx={kx} cy={ky} rx="9" ry="5" fill="#a16207" strokeWidth={3} />)}
      <path d="M-44 -16 h88" stroke="#99f6e4" strokeWidth={4} />
      {voll && <Gestank x={0} y={-48} />}
      {/* Grössere, unsichtbare Tippfläche für Finger */}
      {tippbar && <rect x="-66" y="-60" width="132" height="70" fill="transparent" stroke="none" />}
    </g>
  );
}

/* Ein Häufchen. Bewusst niedlich statt eklig: Kringel mit Glanzpunkt. */
export function Haeufchen({ x, y, onWeg }) {
  return (
    // Position und Plopp auf getrennten Ebenen: die CSS-Animation setzt
    // transform und würde sonst das translate des Attributs überschreiben
    <g transform={`translate(${x} ${y})`} className="zimmer-tippbar"
       onClick={onWeg} role="button" aria-label="Häufchen wegmachen" data-haeufchen="">
      <g {...strich} strokeWidth={4} className="zimmer-haeufchen">
      <Schatten x={0} y={2} rx={22} />
      <path d="M-20 0 q0 -10 10 -10 h20 q10 0 10 10 Z" fill="#92400e" />
      <path d="M-14 -10 q0 -9 9 -9 h10 q9 0 9 9 Z" fill="#a16207" />
      <path d="M-6 -19 q0 -9 7 -10 q5 4 3 10 Z" fill="#b45309" />
      <circle cx="-6" cy="-14" r="2.5" fill="#fde68a" stroke="none" />
      <Gestank x={0} y={-30} />
      <circle cx="0" cy="-14" r="34" fill="transparent" stroke="none" />
      </g>
    </g>
  );
}

/* Tägliches Geschenk: Päckchen mit Schleife, hüpft leicht. Antippen öffnet es. */
export function Geschenk({ x, y, onOeffnen }) {
  return (
    <g transform={`translate(${x} ${y})`} className="zimmer-tippbar" onClick={onOeffnen}
       role="button" aria-label="Geschenk öffnen" data-geschenk="">
      <g className="zimmer-geschenk" {...strich} strokeWidth={4}>
        <Schatten x={0} y={2} rx={36} />
        <rect x="-30" y="-46" width="60" height="46" rx="5" fill="#a78bfa" />
        <rect x="-35" y="-58" width="70" height="16" rx="4" fill="#c4b5fd" />
        <path d="M-6 -58 V0 M6 -58 V0" stroke="#fbbf24" strokeWidth={6} />
        <path d="M-6 -58 V0 M6 -58 V0" fill="none" strokeWidth={0} />
        <path d="M0 -58 C-22 -82 -34 -60 0 -58 C34 -60 22 -82 0 -58 Z" fill="#fbbf24" strokeWidth={3.5} />
        <circle cx="0" cy="-58" r="5" fill="#f59e0b" strokeWidth={3} />
        <rect x="-44" y="-96" width="88" height="100" fill="transparent" stroke="none" />
      </g>
    </g>
  );
}

/* Wandregal (2.4.0): Kissen aufs vorhandene Regal, Stufen an der Wand hinauf. */
export function Wandregal({ x, y }) {
  return (
    <g {...strich} data-moebel="wandregal">
      {[[x - 70, y + 200], [x - 40, y + 140], [x - 10, y + 80]].map(([sx, sy]) => (
        <g key={sy}>
          <path d={`M${sx - 30} ${sy} h60`} strokeWidth={4} />
          <rect x={sx - 30} y={sy - 10} width="60" height="12" rx="4" fill="#a16207" />
        </g>
      ))}
      <path d={`M${x - 66} ${y - 6} q66 -26 132 0 q0 10 -8 12 h-116 q-8 -2 -8 -12 Z`} fill="#93c5fd" />
      <path d={`M${x - 40} ${y - 14} q40 -10 80 0`} fill="none" stroke="#dbeafe" strokeWidth={3} />
    </g>
  );
}

/* Spielball – rollt per CSS-Übergang an seine neue Stelle (zimmer.css). */
export function Ball({ x, y }) {
  return (
    <g className="zimmer-ball" style={{ transform: `translate(${x}px, ${y}px)` }} data-moebel="ball">
      <Schatten x={0} y={2} rx={20} />
      <g className="zimmer-ball-dreh" style={{ transform: `rotate(${x * 2}deg)` }} {...strich} strokeWidth={4}>
        <circle cx="0" cy="-16" r="16" fill="#ef4444" />
        <path d="M-15 -20 q15 8 30 0" fill="none" stroke="#fde047" strokeWidth={5} />
        <circle cx="-6" cy="-24" r="3" fill="#fff" stroke="none" />
      </g>
    </g>
  );
}

/* Katzengras im Topf. */
export function Katzengras({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} {...strich} data-moebel="katzengras">
      <Schatten x={0} y={4} rx={34} />
      <g className="zimmer-gras" fill="none" stroke="#16a34a" strokeWidth={4}>
        {[-18, -10, -2, 6, 14, 20].map((dx, i) => (
          <path key={dx} d={`M${dx} -30 q${i % 2 ? 6 : -6} -24 ${i % 2 ? 2 : -4} -${40 + (i % 3) * 8}`} />
        ))}
      </g>
      <path d="M-28 -32 h56 l-8 32 h-40 Z" fill="#c2410c" />
      <path d="M-30 -32 h60" strokeWidth={6} />
    </g>
  );
}

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
