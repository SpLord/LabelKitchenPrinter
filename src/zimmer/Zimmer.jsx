import { useEffect, useState } from 'react';
import { FREUDE_STREICHELN } from '../cat/tamagotchi.js';
import { FREUNDSCHAFT_STREICHELN } from '../cat/wachstum.js';
import { NAME } from './KuechenKarte.jsx';
import Szene from './Szene.jsx';
import useKatzeImZimmer from './useKatzeImZimmer.js';
import './zimmer.css';

/* ── Gezeichnete Symbole (kein Emoji) ─────────────────────────────────────── */
const K = { stroke: '#2f2a26', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' };
const SYMBOLE = {
  fuettern: <g {...K}><path d="M-22 -2 h44 l-6 18 h-32 Z" fill="#ef4444" /><ellipse cx="0" cy="-2" rx="22" ry="6" fill="#a16207" /></g>,
  spielen: <g {...K}><circle r="18" fill="#60a5fa" /><path d="M-17 -5 q17 10 34 0 M-14 10 q14 -8 28 0" fill="none" stroke="#fff" /><circle r="18" fill="none" /></g>,
  laden: <g {...K}><path d="M-10 -10 v-6 a10 10 0 0 1 20 0 v6" fill="none" /><path d="M-18 -10 h36 l-3 30 h-30 Z" fill="#fbbf24" /></g>,
  kleiderschrank: <g {...K} fill="none"><path d="M0 -6 v-4 a6 6 0 1 1 6 -6" /><path d="M0 -6 L-22 10 h44 Z" fill="#c7b8f5" /></g>,
  einrichten: <g {...K}><rect x="-20" y="-16" width="40" height="22" rx="8" fill="#86c5a4" /><rect x="-24" y="0" width="48" height="16" rx="6" fill="#a7d8bf" /><path d="M-18 16 v5 M18 16 v5" /></g>,
};
const Symbol = ({ name, groesse = 48 }) => (
  <svg viewBox="-28 -28 56 56" width={groesse} height={groesse} aria-hidden="true">{SYMBOLE[name]}</svg>
);

const BEREICHE = [
  { id: 'fuettern', titel: 'Füttern' },
  { id: 'spielen', titel: 'Spielen' },
  { id: 'laden', titel: 'Laden' },
  { id: 'kleiderschrank', titel: 'Kleiderschrank' },
  { id: 'einrichten', titel: 'Einrichten' },
];

/* Was in den noch nicht gebauten Bereichen kommt – ehrlich statt Attrappe. */
const KOMMT = {
  spielen: { etappe: 5, text: 'Laser, Ball und Maus als Spielsachen, der Leckerli-Regen als Fangspiel, das Hütchenspiel mit echten Bechern.' },
  laden: { etappe: 4, text: 'Möbel, Felle und Zubehör mit Vorschau – man sieht vor dem Kauf, wie es aussieht.' },
  kleiderschrank: { etappe: 4, text: 'Felle und Zubehör anlegen und wechseln, die Krone eingeschlossen.' },
  einrichten: { etappe: 4, text: 'Möbel per Tipp auf freie Stellplätze stellen oder umstellen.' },
};

const FUTTER = [
  { id: 'trocken', name: 'Trockenfutter', menge: 20, preis: 3, farbe: '#fde68a' },
  { id: 'nass', name: 'Nassfutter', menge: 35, preis: 5, farbe: '#c7d2fe' },
];

/* ── Bausteine ───────────────────────────────────────────────────────────── */
function Ring({ wert, farbe, titel, children }) {
  const umfang = 2 * Math.PI * 17;
  return (
    <span className="zimmer-ring" title={`${titel} ${Math.round(wert)} %`} aria-label={`${titel} ${Math.round(wert)} Prozent`}>
      <svg viewBox="-24 -24 48 48" width="100%" height="100%">
        <circle r="17" fill="#fff" stroke="#e5d6c4" strokeWidth="6" />
        <circle r="17" fill="none" stroke={farbe} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(umfang * Math.max(0, Math.min(100, wert))) / 100} ${umfang}`} transform="rotate(-90)" />
        {children}
      </svg>
    </span>
  );
}

function Herzen({ anzahl }) {
  return (
    <span className="zimmer-herzen" aria-label={`${anzahl} von 5 Herzen`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="-16 -8 32 30" aria-hidden="true">
          <path d="M0 4 C-6 -6 -18 -2 -14 8 C-11 15 0 20 0 20 C0 20 11 15 14 8 C18 -2 6 -6 0 4 Z"
                fill={i < anzahl ? '#ef4444' : '#fff'} stroke="#2f2a26" strokeWidth="3" />
        </svg>
      ))}
    </span>
  );
}

function Blatt({ bereich, zustand, onZu }) {
  const titel = BEREICHE.find((b) => b.id === bereich)?.titel;
  return (
    <div className="zimmer-blatt-huelle" onClick={onZu}>
      <section className="zimmer-blatt" role="dialog" aria-label={titel} onClick={(e) => e.stopPropagation()}>
        <div className="zimmer-blatt-griff" />
        <header className="zimmer-blatt-kopf">
          <Symbol name={bereich} groesse={40} />
          <h2>{titel}</h2>
          {bereich === 'fuettern' && <span className="zimmer-blatt-info">Napf {Math.round(zustand.napf)} % voll</span>}
          <button className="zimmer-knopf zimmer-blatt-zu" onClick={onZu} aria-label="Schließen">
            <svg viewBox="-10 -10 20 20" width="45%" height="45%" aria-hidden="true"><path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#2f2a26" strokeWidth="3.2" strokeLinecap="round" /></svg>
          </button>
        </header>

        {bereich === 'fuettern' ? (
          <div className="zimmer-karten">
            {FUTTER.map((f) => {
              const voll = zustand.napf >= 100;
              const zuTeuer = zustand.muenzen < f.preis;
              return (
                <article key={f.id} className="zimmer-karte">
                  <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
                    {f.id === 'trocken'
                      ? <g {...K}><path d="M18 10 h44 l6 54 h-56 Z" fill={f.farbe} /><circle cx="40" cy="40" r="10" fill="#a16207" strokeWidth="3" /></g>
                      : <g {...K}><rect x="14" y="18" width="52" height="44" rx="7" fill={f.farbe} /><ellipse cx="40" cy="18" rx="26" ry="7" fill="#e0e7ff" /><path d="M22 38 h36" stroke="#6366f1" strokeWidth="6" /></g>}
                  </svg>
                  <h3>{f.name}</h3>
                  <p>+{f.menge} in den Napf</p>
                  <button className="zimmer-preis" disabled={voll || zuTeuer}
                          onClick={() => zustand.napfFuellen(f.menge, f.preis)}>
                    <span className="zimmer-muenze" aria-hidden="true" /> {f.preis}
                  </button>
                  {voll && <small>Napf ist voll</small>}
                  {!voll && zuTeuer && <small>Zu wenig Münzen</small>}
                </article>
              );
            })}
            {zustand.krank ? (
              <article className="zimmer-karte zimmer-karte-wichtig">
                <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
                  <g {...K}><rect x="14" y="22" width="52" height="28" rx="10" fill="#fde68a" /><path d="M34 36 h12 M40 30 v12" strokeWidth="3.5" /></g>
                </svg>
                <h3>Medizin</h3>
                <p>{zustand.medizinPreis > 0 ? 'Macht sie sofort wieder gesund.' : 'Kostenlos, wenn die Münzen nicht reichen.'}</p>
                <button className="zimmer-preis" onClick={zustand.medizinGeben}>
                  {zustand.medizinPreis > 0 ? <><span className="zimmer-muenze" aria-hidden="true" /> {zustand.medizinPreis}</> : 'kostenlos'}
                </button>
              </article>
            ) : zustand.notrationMoeglich ? (
              <article className="zimmer-karte zimmer-karte-wichtig">
                <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
                  <g {...K}><path d="M18 10 h44 l6 54 h-56 Z" fill="#fef3c7" /><path d="M30 34 h20 M40 24 v20" stroke="#16a34a" strokeWidth="5" /></g>
                </svg>
                <h3>Notration</h3>
                <p>Keine Münzen? Einmal am Tag gibt es kostenlos +20.</p>
                <button className="zimmer-preis" disabled={zustand.notrationHeute} onClick={zustand.notrationGeben}>kostenlos</button>
                {zustand.notrationHeute && <small>Morgen wieder</small>}
              </article>
            ) : (
              <article className="zimmer-karte zimmer-karte-info">
                <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
                  <path d="M40 8 C26 28 22 36 22 42 a18 18 0 0 0 36 0 c0 -6 -4 -14 -18 -34 Z" fill="#60a5fa" {...K} />
                </svg>
                <h3>Wasser</h3>
                <p>Immer frisch und kostenlos – sie trinkt, wenn sie Durst hat.</p>
              </article>
            )}
          </div>
        ) : (
          <div className="zimmer-kommt">
            <strong>Kommt in Etappe {KOMMT[bereich].etappe}</strong>
            <p>{KOMMT[bereich].text}</p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Das Zimmer ──────────────────────────────────────────────────────────── */
export default function Zimmer({ zustand, onZu }) {
  const katze = useKatzeImZimmer(zustand.lageRef, zustand.anwendenRef);
  const [bereich, setBereich] = useState(null);
  const [herzchen, setHerzchen] = useState(0);

  useEffect(() => {
    const taste = (e) => { if (e.key === 'Escape') (bereich ? setBereich(null) : onZu()); };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [bereich, onZu]);

  const streicheln = () => {
    zustand.erfreuen(FREUDE_STREICHELN);
    zustand.wachstum.naeherKommen(FREUNDSCHAFT_STREICHELN);
    setHerzchen((n) => n + 1);
  };

  return (
    <div className="zimmer" role="dialog" aria-label="Katzenzimmer">
      <div className="zimmer-buehne">
        <Szene moebel={zustand.moebel} frei={zustand.frei} napf={zustand.napf} katze={katze}
               fell={zustand.fell} zubehoer={zustand.angelegt} onKatze={streicheln} />

        {herzchen > 0 && (
          <span key={herzchen} className="zimmer-herzchen" aria-hidden="true"
                style={{ left: `${katze.pos.x / 10.24}%`, top: `${(katze.pos.y - 175) / 7.68}%` }}>
            <svg viewBox="-16 -8 32 30"><path d="M0 4 C-6 -6 -18 -2 -14 8 C-11 15 0 20 0 20 C0 20 11 15 14 8 C18 -2 6 -6 0 4 Z" fill="#f87171" stroke="#2f2a26" strokeWidth="3" /></svg>
          </span>
        )}

        <header className="zimmer-kopf">
          <button className="zimmer-knopf zimmer-zurueck" onClick={onZu}>← Küche</button>
          <span className="zimmer-ringe">
            <Ring wert={zustand.hunger} farbe="#ef4444" titel="Hunger">
              <path d="M-8 -2 h16 l-3 7 h-10 Z" fill="#ef4444" stroke="#2f2a26" strokeWidth="1.8" />
            </Ring>
            <Ring wert={zustand.durst} farbe="#3b82f6" titel="Durst">
              <path d="M0 -9 C-4 -3 -5 0 -5 2 a5 5 0 0 0 10 0 c0 -2 -1 -5 -5 -11 Z" fill="#3b82f6" />
            </Ring>
            <Ring wert={zustand.laune} farbe="#f59e0b" titel="Laune">
              <circle cx="-4" cy="-3" r="1.8" fill="#2f2a26" /><circle cx="4" cy="-3" r="1.8" fill="#2f2a26" />
              <path d="M-5 3 q5 5 10 0" fill="none" stroke="#2f2a26" strokeWidth="2" strokeLinecap="round" />
            </Ring>
          </span>
          <span className="zimmer-name">
            <strong>{NAME}</strong>
            <span className="zimmer-phase">{zustand.wachstum.phase.name}</span>
            <Herzen anzahl={zustand.wachstum.herzen} />
          </span>
          <span className="zimmer-knopf zimmer-geld" aria-label={`${zustand.muenzen} Münzen`}>
            <span className="zimmer-muenze" aria-hidden="true" /> {zustand.muenzen}
          </span>
        </header>

        <nav className="zimmer-menue" aria-label="Bereiche">
          {BEREICHE.map((b) => (
            <button key={b.id} className={bereich === b.id ? 'aktiv' : ''} onClick={() => setBereich(b.id)}>
              <Symbol name={b.id} />
              <span>{b.titel}</span>
            </button>
          ))}
        </nav>

        {bereich && <Blatt bereich={bereich} zustand={zustand} onZu={() => setBereich(null)} />}
      </div>
    </div>
  );
}
