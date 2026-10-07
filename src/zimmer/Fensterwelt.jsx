/*
  Was es im und am Fenster zu sehen gibt (Etappe 7), dazu die Fundstücke.
  Alles gezeichnet, Stil A: dunkle Kontur, warme Flächen, kein Emoji.
*/
const K = { stroke: '#2f2a26', strokeLinejoin: 'round', strokeLinecap: 'round' };

/* Sonne, tiefe Sonne oder Mond mit Sternen – im Fenster rechts oben. */
export function Gestirn({ art }) {
  if (art === 'mond') {
    return (
      <g data-gestirn="mond">
        <g fill="#fef9c3">
          <circle cx="96" cy="132" r="2.5" /><circle cx="140" cy="150" r="2" /><circle cx="250" cy="180" r="2.5" />
          <circle cx="200" cy="250" r="2" /><circle cx="110" cy="240" r="1.8" />
        </g>
        <path d="M232 132 a20 20 0 1 0 14 34 a16 16 0 1 1 -14 -34 Z" fill="#fef3c7" stroke="none" />
      </g>
    );
  }
  const tief = art === 'sonne-tief';
  return <circle data-gestirn={art} cx="226" cy={tief ? 250 : 150} r={tief ? 24 : 20} fill={tief ? '#fdba74' : '#fde68a'} stroke="none" />;
}

/* Wandlampe neben dem Fenster – abends und nachts an. */
export function Wandlampe({ an }) {
  return (
    <g data-lampe={an ? 'an' : 'aus'}>
      {an && <ellipse cx="340" cy="210" rx="120" ry="150" fill="#fde68a" opacity="0.22" className="zimmer-lampenschein" />}
      <g {...K} strokeWidth="5">
        <path d="M340 120 v40" />
        <path d="M312 160 h56 l-12 40 h-32 Z" fill={an ? '#fef3c7' : '#f5e6c8'} />
        {an && <path d="M326 206 h28" stroke="#fbbf24" strokeWidth="4" />}
      </g>
    </g>
  );
}

/* Besucher am Fenster: fliegt einmal quer durchs Bild (CSS, zimmer.css). */
export function Besucher({ art }) {
  return (
    <g className={`zimmer-besuch zimmer-besuch-${art}`} data-besuch={art} {...K}>
      {art === 'vogel' && (
        <g strokeWidth="3.5">
          <ellipse cx="0" cy="0" rx="16" ry="11" fill="#60a5fa" />
          <circle cx="13" cy="-7" r="8" fill="#60a5fa" />
          <path d="M20 -7 l8 2 l-8 3 Z" fill="#fbbf24" strokeWidth="2.5" />
          <circle cx="15" cy="-9" r="1.8" fill="#2f2a26" stroke="none" />
          <path className="zimmer-fluegel" d="M-4 -4 q-6 -18 -18 -10 q8 8 18 10 Z" fill="#93c5fd" strokeWidth="3" />
        </g>
      )}
      {art === 'schmetterling' && (
        <g strokeWidth="3" className="zimmer-fluegel">
          <path d="M0 0 C-22 -26 -30 4 0 4 Z" fill="#f472b6" />
          <path d="M0 0 C22 -26 30 4 0 4 Z" fill="#f472b6" />
          <path d="M0 4 C-16 20 -6 24 0 8 Z M0 4 C16 20 6 24 0 8 Z" fill="#fbcfe8" />
          <path d="M0 -6 V12" strokeWidth="4" />
        </g>
      )}
      {art === 'motte' && (
        <g strokeWidth="2.5" className="zimmer-fluegel">
          <path d="M0 0 C-16 -14 -20 6 0 3 Z M0 0 C16 -14 20 6 0 3 Z" fill="#e7e5e4" />
          <path d="M0 -4 V8" strokeWidth="3.5" />
        </g>
      )}
    </g>
  );
}

/* Fundstücke, um 0/0 gezeichnet, etwa 40 Punkte gross. */
export function FundstueckBild({ id }) {
  switch (id) {
    case 'feder':
      return <g {...K} strokeWidth="3"><path d="M-14 16 C-6 -6 8 -18 16 -18 C14 -4 2 12 -14 16 Z" fill="#60a5fa" /><path d="M-16 18 L10 -10" strokeWidth="2.5" /></g>;
    case 'knopf':
      return <g {...K} strokeWidth="3.5"><circle r="15" fill="#fbbf24" /><circle r="9" fill="none" strokeWidth="2.5" />{[[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" fill="#2f2a26" stroke="none" />)}</g>;
    case 'murmel':
      return <g {...K} strokeWidth="3.5"><circle r="14" fill="#a5f3fc" /><path d="M-8 4 q8 -12 16 -2" fill="none" stroke="#0891b2" strokeWidth="4" /><circle cx="-5" cy="-6" r="3" fill="#fff" stroke="none" /></g>;
    case 'korken':
      return <g {...K} strokeWidth="3.5"><path d="M-12 -12 h24 l-3 26 h-18 Z" fill="#d6a15d" /><ellipse cx="0" cy="-12" rx="12" ry="4" fill="#e7c08a" /><circle cx="-3" cy="2" r="1.6" fill="#7c4a1e" stroke="none" /><circle cx="4" cy="8" r="1.6" fill="#7c4a1e" stroke="none" /></g>;
    case 'muschel':
      return <g {...K} strokeWidth="3.5"><path d="M-18 8 C-18 -16 18 -16 18 8 Z" fill="#fbcfe8" /><path d="M0 8 V-12 M-9 8 L-6 -10 M9 8 L6 -10" strokeWidth="2.5" /><path d="M-6 8 h12 v6 h-12 Z" fill="#f9a8d4" /></g>;
    case 'kastanie':
      return <g {...K} strokeWidth="3.5"><path d="M0 -16 C16 -16 18 4 10 12 C4 18 -4 18 -10 12 C-18 4 -16 -16 0 -16 Z" fill="#92400e" /><path d="M-8 6 q8 6 16 0" fill="#e7c08a" strokeWidth="2.5" /><circle cx="-5" cy="-6" r="3" fill="#d97706" stroke="none" /></g>;
    case 'socke':
      return <g {...K} strokeWidth="3.5"><path d="M-8 -18 h14 v16 l10 8 a6 6 0 0 1 -6 10 l-16 -8 Z" fill="#c4b5fd" /><path d="M-8 -12 h14" stroke="#7c3aed" strokeWidth="3" /></g>;
    case 'stern':
      return <g {...K} strokeWidth="3"><path d="M0 -18 L5 -5 L18 -5 L8 3 L12 16 L0 8 L-12 16 L-8 3 L-18 -5 L-5 -5 Z" fill="#fde047" /><circle cx="-4" cy="-4" r="2" fill="#fff" stroke="none" /></g>;
    default:
      return <circle r="12" fill="#d1d5db" {...K} strokeWidth="3" />;
  }
}

/* Wetter im Fenster (2.4.0) – innerhalb des Fenster-Ausschnitts gezeichnet. */
export function Wetter({ art }) {
  if (art === 'wolken') {
    return (
      <g data-wetter="wolken" fill="#e5e7eb" stroke="#2f2a26" strokeWidth="3.5">
        <path className="zimmer-wolke" d="M96 200 q4 -20 24 -16 q8 -18 28 -8 q20 -6 22 14 q12 4 6 16 h-74 q-12 -2 -6 -6 Z" />
        <path className="zimmer-wolke langsam" d="M170 150 q4 -16 20 -12 q8 -14 24 -6 q16 -4 18 12 q10 4 4 12 h-60 q-10 -2 -6 -6 Z" />
      </g>
    );
  }
  if (art === 'regen') {
    return (
      <g data-wetter="regen">
        <rect x="70" y="110" width="200" height="180" fill="#64748b" opacity="0.35" />
        <g className="zimmer-regen" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round">
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${84 + i * 14} ${100 + (i * 37) % 120} l-6 14`} />
          ))}
        </g>
      </g>
    );
  }
  if (art === 'schnee') {
    return (
      <g data-wetter="schnee" className="zimmer-schnee" fill="#fff">
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={82 + (i * 23) % 180} cy={104 + (i * 41) % 170} r={2 + (i % 3)} />
        ))}
      </g>
    );
  }
  return null;
}
