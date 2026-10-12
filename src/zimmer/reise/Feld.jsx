/*
  Ein Feld der Leckerli-Reise, gezeichnet im 40 × 40-Feld um (0, 0).
  Leckerli tragen ihre Spezial-Zeichnung obendrauf: Streifen (reihe/spalte),
  eine Schleife wie ein Paket (bombe). Dazu Regenbogen-Knäuel, Kiste, Dose.
*/
const K = { stroke: '#2f2a26', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };

export const BILD = {
  fisch: <g {...K}><path d="M-14 0 C-6 -12 12 -12 16 0 C12 12 -6 12 -14 0 Z" fill="#fb923c" /><path d="M-14 0 l-8 -8 v16 Z" fill="#fb923c" /><circle cx="8" cy="-2" r="2" fill="#2f2a26" stroke="none" /></g>,
  keks: <g {...K}><circle r="15" fill="#d6a15d" /><g fill="#7c4a1e" stroke="none"><circle cx="-6" cy="-5" r="2.6" /><circle cx="5" cy="-7" r="2.2" /><circle cx="6" cy="5" r="2.6" /><circle cx="-4" cy="7" r="2.2" /></g></g>,
  maus: <g {...K}><circle cx="-10" cy="-9" r="7" fill="#d1d5db" /><circle cx="10" cy="-9" r="7" fill="#d1d5db" /><ellipse cx="0" cy="3" rx="13" ry="11" fill="#d1d5db" /><circle cx="-4" cy="1" r="1.8" fill="#2f2a26" stroke="none" /><circle cx="4" cy="1" r="1.8" fill="#2f2a26" stroke="none" /><circle cx="0" cy="7" r="2.4" fill="#f472b6" stroke="none" /></g>,
  wolle: <g {...K}><circle r="14" fill="#f472b6" /><path d="M-11 -5 q11 7 22 0 M-12 4 q12 7 24 0" fill="none" stroke="#9d174d" strokeWidth="2" /></g>,
  feder: <g {...K}><path d="M12 -15 C-10 -10 -14 6 -12 14 C0 12 14 0 12 -15 Z" fill="#60a5fa" /><path d="M-12 14 L8 -8" fill="none" strokeWidth="2" /></g>,
  milch: <g {...K}><path d="M-9 -8 l4 -8 h10 l4 8 v20 a3 3 0 0 1 -3 3 h-12 a3 3 0 0 1 -3 -3 Z" fill="#f8fafc" /><rect x="-9" y="-1" width="18" height="7" fill="#22c55e" strokeWidth="2" /><path d="M-5 -16 h10" strokeWidth="2.5" /></g>,
  regen: (
    <g {...K}>
      <circle r="15" fill="#fff" />
      <g fill="none" strokeWidth="3.4">
        <path d="M-13 -4 a14 14 0 0 1 26 0" stroke="#ef4444" /><path d="M-13 1 a14 12 0 0 1 26 0" stroke="#f59e0b" />
        <path d="M-12 6 a13 10 0 0 1 24 0" stroke="#22c55e" /><path d="M-10 10 a11 8 0 0 1 20 0" stroke="#3b82f6" />
      </g>
      <circle r="15" fill="none" />
    </g>
  ),
  dose: (
    <g {...K}>
      <ellipse cx="0" cy="-11" rx="13" ry="4" fill="#e5e7eb" />
      <path d="M-13 -11 v22 a13 4 0 0 0 26 0 v-22" fill="#cbd5e1" />
      <rect x="-13" y="-5" width="26" height="11" fill="#38bdf8" strokeWidth="2" />
      <path d="M-6 0.5 q4 -4 9 0 q-5 4 -9 0 Z M-6 0.5 l-3 -3 v6 Z" fill="#fb923c" strokeWidth="1.5" />
    </g>
  ),
};

function Kiste({ leben }) {
  return (
    <g {...K}>
      <rect x="-16" y="-16" width="32" height="32" rx="3" fill={leben > 1 ? '#a16207' : '#d6a15d'} />
      <path d="M-16 -5 h32 M-16 6 h32" stroke={leben > 1 ? '#78350f' : '#b07a3a'} strokeWidth="2.5" />
      <path d="M-14 -14 L14 14" stroke={leben > 1 ? '#78350f' : '#b07a3a'} strokeWidth="3" />
      {leben > 1 && <g fill="#9ca3af" strokeWidth="1.5"><rect x="-17" y="-12" width="5" height="24" /><rect x="12" y="-12" width="5" height="24" /></g>}
      <rect x="-16" y="-16" width="32" height="32" rx="3" fill="none" />
    </g>
  );
}

function Spezial({ art }) {
  if (art === 'reihe' || art === 'spalte') {
    const quer = art === 'reihe';
    return (
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.95" className="feld-streifen">
        {[-6, 0, 6].map((d) => (quer ? <path key={d} d={`M-15 ${d} h30`} /> : <path key={d} d={`M${d} -15 v30`} />))}
      </g>
    );
  }
  if (art === 'bombe') {
    return (
      <g {...K} strokeWidth="2.5" className="feld-paket">
        <circle r="17" fill="none" stroke="#fde047" strokeWidth="4" />
        <path d="M0 -14 c-8 -8 -12 2 0 0 c12 2 8 -8 0 0" fill="#ef4444" />
      </g>
    );
  }
  return null;
}

export default function Feld({ feld }) {
  if (feld.art === 'kiste') return <Kiste leben={feld.leben ?? 1} />;
  return (
    <g>
      {BILD[feld.art] ?? BILD.keks}
      {feld.spezial && <Spezial art={feld.spezial} />}
    </g>
  );
}
