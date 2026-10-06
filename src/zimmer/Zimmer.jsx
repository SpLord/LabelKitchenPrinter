import { useCallback, useEffect, useRef, useState } from 'react';
import { FREUDE_STREICHELN } from '../cat/tamagotchi.js';
import { FREUNDSCHAFT_STREICHELN } from '../cat/wachstum.js';
import { PLAETZE } from './einrichtung.js';
import { KLO } from './klo.js';
import NamensFeld from '../labels/NamensFeld.jsx';
import EinrichtenKarten from './EinrichtenKarten.jsx';
import { KleiderschrankKarten, LadenKarten } from './GarderobeKarten.jsx';
import { FreundschaftKarten, HerzFeier } from './Freundschaft.jsx';
import Szene from './Szene.jsx';
import SpielFederangel from './SpielFederangel.jsx';
import SpielMaeuseloch from './SpielMaeuseloch.jsx';
import ShellGame, { STAKE } from '../ShellGame.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import { launeFuer } from './maeuseloch.js';
import { BESUCH, besucher, tageszeit } from './tageszeit.js';
import { FUNDSTUECKE } from './fundstuecke.js';
import SpielLeckerli from './SpielLeckerli.jsx';
import { FEDER, LECKERLI, muenzenFuerRunde, wartezeit } from './spiele.js';

const KEY_LECKERLI = 'zimmer_leckerli_zuletzt';
const leckerliZuletzt = () => { try { return localStorage.getItem(KEY_LECKERLI); } catch { return null; } };
import useKatzeImZimmer from './useKatzeImZimmer.js';
import './zimmer.css';

/* ── Gezeichnete Symbole (kein Emoji) ─────────────────────────────────────── */
const K = { stroke: '#2f2a26', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' };
const SYMBOLE = {
  fuettern: <g {...K}><path d="M-22 -2 h44 l-6 18 h-32 Z" fill="#ef4444" /><ellipse cx="0" cy="-2" rx="22" ry="6" fill="#a16207" /></g>,
  spielen: <g {...K}><circle r="18" fill="#60a5fa" /><path d="M-17 -5 q17 10 34 0 M-14 10 q14 -8 28 0" fill="none" stroke="#fff" /><circle r="18" fill="none" /></g>,
  laden: <g {...K}><path d="M-10 -10 v-6 a10 10 0 0 1 20 0 v6" fill="none" /><path d="M-18 -10 h36 l-3 30 h-30 Z" fill="#fbbf24" /></g>,
  kleiderschrank: <g {...K} fill="none"><path d="M0 -6 v-4 a6 6 0 1 1 6 -6" /><path d="M0 -6 L-22 10 h44 Z" fill="#c7b8f5" /></g>,
  herzen: <g {...K}><path d="M0 -6 C-6 -16 -22 -12 -18 2 C-15 11 0 20 0 20 C0 20 15 11 18 2 C22 -12 6 -16 0 -6 Z" fill="#ef4444" /></g>,
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

/* Spielen: kurze Spiele für die Pause, jedes etwa eine halbe Minute. */
function SpieleKarten({ onSpiel, muenzen }) {
  const warten = wartezeit(leckerliZuletzt());
  const minuten = Math.ceil(warten / 60_000);
  return (
    <div className="zimmer-karten zimmer-karten-klein">
      <article className="zimmer-karte">
        <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
          <g {...K}><path d="M70 2 L44 30" stroke="#a16207" strokeWidth="6" /><path d="M44 30 Q40 46 40 40" fill="none" strokeWidth="2" />
            <path d="M40 34 C30 42 32 56 40 64 C48 56 50 42 40 34 Z" fill="#f472b6" strokeWidth="3" /></g>
        </svg>
        <h3>Federangel</h3>
        <p>Feder führen, die Katze jagt hinterher. Bringt Laune und Freundschaft.</p>
        <button className="zimmer-preis" onClick={() => onSpiel('feder')}>spielen</button>
      </article>
      <article className="zimmer-karte">
        <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
          <g {...K} strokeWidth="3.5"><path d="M30 14 q10 -10 20 0 q-10 10 -20 0 Z" fill="#fb923c" /><circle cx="56" cy="30" r="8" fill="#d6a15d" />
            <path d="M14 46 h52 l-6 18 h-40 Z" fill="#ef4444" /><ellipse cx="40" cy="46" rx="26" ry="5" fill="#7f1d1d" /></g>
        </svg>
        <h3>Leckerli fangen</h3>
        <p>Napf darunter schieben. Bis zu {LECKERLI.maxMuenzen} Münzen, einmal pro Stunde.</p>
        <button className="zimmer-preis" disabled={warten > 0} onClick={() => onSpiel('leckerli')}>spielen</button>
        {warten > 0 && <small>wieder in {minuten} min</small>}
      </article>
      <article className="zimmer-karte">
        <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
          <g {...K}><path d="M10 60 a30 30 0 0 1 60 0 Z" fill="#3f2a1e" /><ellipse cx="40" cy="48" rx="12" ry="9" fill="#d1d5db" />
            <circle cx="33" cy="38" r="5" fill="#fbcfe8" /><circle cx="47" cy="38" r="5" fill="#fbcfe8" />
            <circle cx="35" cy="47" r="2" fill="#2f2a26" stroke="none" /><circle cx="45" cy="47" r="2" fill="#2f2a26" stroke="none" /></g>
        </svg>
        <h3>Mäuseloch</h3>
        <p>Maus antippen, bevor sie verschwindet. Bringt Laune.</p>
        <button className="zimmer-preis" onClick={() => onSpiel('maus')}>spielen</button>
      </article>
      <article className="zimmer-karte">
        <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
          <g {...K} strokeWidth="3.5">{[16, 40, 64].map((x) => <path key={x} d={`M${x - 12} 60 l4 -34 h16 l4 34 Z`} fill="#ef4444" />)}
            <circle cx="40" cy="64" r="5" fill="#fbbf24" /></g>
        </svg>
        <h3>Hütchenspiel</h3>
        <p>Unter welchem Becher liegt die Münze? Einsatz {STAKE}.</p>
        <button className="zimmer-preis" disabled={muenzen < STAKE} onClick={() => onSpiel('huetchen')}>spielen</button>
        {muenzen < STAKE && <small>Zu wenig Münzen</small>}
      </article>
    </div>
  );
}

function Blatt({ bereich, zustand, onZu, onSpiel, onGekauft, onAngezogen }) {
  const titel = BEREICHE.find((b) => b.id === bereich)?.titel ?? (bereich === 'herzen' ? 'Freundschaft' : '');
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

        <div className="zimmer-blatt-inhalt">
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
        ) : bereich === 'spielen' ? (
          <SpieleKarten onSpiel={onSpiel} muenzen={zustand.muenzen} />
        ) : bereich === 'einrichten' ? (
          <EinrichtenKarten zustand={zustand} onGekauft={onGekauft} />
        ) : bereich === 'herzen' ? (
          <FreundschaftKarten herzen={zustand.wachstum.herzen} gefunden={zustand.gefunden} />
        ) : bereich === 'laden' ? (
          <LadenKarten zustand={zustand} onGekauft={onAngezogen} />
        ) : (
          <KleiderschrankKarten zustand={zustand} />
        )}
        </div>
      </section>
    </div>
  );
}

/* ── Das Zimmer ──────────────────────────────────────────────────────────── */
export default function Zimmer({ zustand, onZu }) {
  const katze = useKatzeImZimmer(zustand.lageRef, zustand.anwendenRef);
  const [bereich, setBereich] = useState(null);
  const [herzchen, setHerzchen] = useState(0);
  const [spiel, setSpiel] = useState(null);       // 'feder' | 'leckerli' | null
  const [ergebnis, setErgebnis] = useState(null);

  const spielStarten = (art) => {
    setBereich(null);
    if (art === 'leckerli') {
      try { localStorage.setItem(KEY_LECKERLI, String(Date.now())); } catch { /* gesperrt */ }
    }
    setSpiel(art);
  };

  const { erfreuen, naeher, setMuenzen, name, pflege } = zustand;
  const { freigeben } = katze;
  const federEnde = useCallback((faenge) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    setErgebnis(faenge > 0 ? `${faenge} ${faenge === 1 ? 'Fang' : 'Fänge'} – ${name} ist zufrieden` : `${name} hat die Feder nicht erwischt`);
  }, [freigeben, name, pflege]);
  const leckerliEnde = useCallback((faenge) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    const muenzen = muenzenFuerRunde(faenge);
    if (muenzen > 0) setMuenzen((c) => c + muenzen);
    setErgebnis(muenzen > 0 ? `+${muenzen} Münzen` : 'Diesmal nichts gefangen');
  }, [freigeben, setMuenzen, pflege]);
  const mausEnde = useCallback((treffer) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    if (treffer > 0) {
      erfreuen(launeFuer(treffer));
      naeher('spielen', 1);
    }
    setErgebnis(treffer > 0 ? `${treffer} ${treffer === 1 ? 'Maus' : 'Mäuse'} – ${name} ist ganz aufgedreht` : 'Die Mäuse waren zu flink');
  }, [freigeben, pflege, erfreuen, naeher, name]);
  const mausTreffer = useCallback(() => setHerzchen((n) => n + 1), []);

  const federFang = useCallback(() => {
    erfreuen(FEDER.laune);
    naeher('spielen', 1);
    setHerzchen((n) => n + 1);
  }, [erfreuen, naeher]);

  useEffect(() => {
    if (!ergebnis) return undefined;
    const t = setTimeout(() => setErgebnis(null), 2600);
    return () => clearTimeout(t);
  }, [ergebnis]);

  useEffect(() => {
    const taste = (e) => { if (e.key === 'Escape' && !spiel) (bereich ? setBereich(null) : onZu()); };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [bereich, onZu, spiel]);

  // Putzen: Münze fliegt an der Stelle hoch; ist der Tageslohn aus, sagt es ein Hinweis
  const [lohnPops, setLohnPops] = useState([]);
  useEffect(() => {
    if (lohnPops.length === 0) return undefined;
    const t = setTimeout(() => setLohnPops([]), 1200);
    return () => clearTimeout(t);
  }, [lohnPops]);
  const putzen = (was) => {
    const ort = was === 'klo' ? { x: PLAETZE.klo.x, y: PLAETZE.klo.y - 40 } : zustand.haeufchen.find((h) => h.id === was);
    if (!ort) return;
    const lohn = zustand.putzen(was);
    if (lohn > 0) {
      setLohnPops((p) => [...p.slice(-3), { id: `${was}-${Date.now()}`, x: ort.x, y: ort.y, lohn }]);
    } else {
      setErgebnis(`Sauber! Fürs Putzen gibt es heute keine Münzen mehr (${KLO.tagesGrenze} am Tag)`);
    }
  };

  // Gekauft: Blatt zu, das Möbel ploppt an seinem Platz auf
  const [neuesMoebel, setNeuesMoebel] = useState(null);
  const gekauft = (a) => {
    setBereich(null);
    setNeuesMoebel(a.id);
    setErgebnis(a.id === 'glueckspfote' ? 'Die Glückspfote wirkt ab sofort' : `${a.name} steht jetzt im Zimmer`);
  };
  useEffect(() => {
    if (!neuesMoebel) return undefined;
    const t = setTimeout(() => setNeuesMoebel(null), 1500);
    return () => clearTimeout(t);
  }, [neuesMoebel]);

  // Geschenk öffnen: Münzregen an der Stelle, Meldung mit dem Betrag
  const geschenkOeffnen = () => {
    const m = zustand.geschenkOeffnen();
    if (m <= 0) return;
    setLohnPops((p) => [...p.slice(-3), { id: `geschenk-${Date.now()}`, x: 790, y: 580, lohn: m }]);
    setErgebnis(`Geschenk von ${zustand.name}: +${m} Münzen`);
  };

  // Begrüssung (erstes Herz): beim Öffnen kommt sie nach vorn gelaufen
  const [rollt, setRollt] = useState(false);
  const { folge: folgeKatze, freigeben: freigebenKatze } = katze;
  const begruesst = zustand.kann('begruessen');
  useEffect(() => {
    if (!begruesst) return undefined;
    const hin = setTimeout(() => { folgeKatze({ x: 512, y: 650 }); setHerzchen((n) => n + 1); }, 400);
    const weiter = setTimeout(() => freigebenKatze(), 2600);
    return () => { clearTimeout(hin); clearTimeout(weiter); };
    // nur beim Öffnen des Zimmers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!rollt) return undefined;
    const t = setTimeout(() => setRollt(false), 1000);
    return () => clearTimeout(t);
  }, [rollt]);

  // Tageszeit nach der echten Uhr; ab und zu schaut jemand am Fenster vorbei
  const zeit = tageszeit(new Date(zustand.jetzt));
  const [besuch, setBesuch] = useState(null);
  const zeitRef = useRef(zeit);
  zeitRef.current = zeit;
  useEffect(() => {
    let uhr;
    const naechster = () => {
      const warten = BESUCH.abstandMin + Math.random() * (BESUCH.abstandMax - BESUCH.abstandMin);
      uhr = setTimeout(() => {
        setBesuch({ id: Date.now(), art: besucher(zeitRef.current) });
        uhr = setTimeout(() => { setBesuch(null); naechster(); }, BESUCH.dauer);
      }, warten);
    };
    naechster();
    return () => clearTimeout(uhr);
  }, []);

  // Fundstück aufheben: ins Album, ein paar Münzen, und es fliegt zur Anzeige
  const fundAufheben = () => {
    const r = zustand.fundEinsammeln();
    if (!r) return;
    const name = FUNDSTUECKE.find((f) => f.id === r.id)?.name ?? 'etwas';
    setLohnPops((p) => [...p.slice(-3), { id: `fund-${Date.now()}`, x: 380, y: 600, lohn: r.lohn }]);
    setErgebnis(r.neu ? `${zustand.name} hat dir etwas mitgebracht: ${name} – neu im Album!` : `${name} – kennst du schon`);
  };

  const streicheln = () => {
    if (zustand.kann('rollen')) setRollt(true);
    zustand.pflege('streicheln');
    zustand.erfreuen(FREUDE_STREICHELN);
    zustand.naeher('streicheln', FREUNDSCHAFT_STREICHELN);
    setHerzchen((n) => n + 1);
  };

  return (
    <div className="zimmer" role="dialog" aria-label="Katzenzimmer">
      <div className="zimmer-buehne">
        <Szene moebel={zustand.moebel} frei={zustand.frei} napf={zustand.napf} katze={katze}
               klo={zustand.klo} kloVoll={zustand.klo >= KLO.kapazitaet} haeufchen={zustand.haeufchen}
               fell={zustand.fell} zubehoer={zustand.angelegt} onKatze={streicheln} onPutzen={putzen}
               neu={neuesMoebel} onFrei={() => setBereich('einrichten')}
               geschenk={zustand.geschenkHeute} onGeschenk={geschenkOeffnen} rollt={rollt}
               tageszeit={zeit} besuch={besuch} fund={zustand.fundOffen} onFund={fundAufheben} />

        {lohnPops.map((p) => (
          <span key={p.id} className="zimmer-lohn" aria-hidden="true"
                style={{
                  left: `${p.x / 10.24}%`, top: `${(p.y - 40) / 7.68}%`,
                  // Ziel: die Münzanzeige oben rechts (Bühne ist 100 × 75 cqw)
                  '--zum-x': `${93 - p.x / 10.24}cqw`, '--zum-y': `${(5 - (p.y - 40) / 7.68) * 0.75}cqw`,
                }}>
            <span className="zimmer-muenze" />+{p.lohn}
          </span>
        ))}

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
            {/* Antippen und tippen: so bekommt sie ihren eigenen Namen */}
            <NamensFeld className="zimmer-name-feld" value={zustand.name} onCommit={zustand.umbenennen}
                        aria-label="Name der Katze – antippen zum Ändern" maxLength={16} spellCheck={false} />
            <span className="zimmer-phase">{zustand.wachstum.phase.name}</span>
            <button className="zimmer-herzen-knopf" onClick={() => setBereich('herzen')}
                    aria-label={`${zustand.wachstum.herzen} von 5 Herzen – was bringt Freundschaft?`}>
              <Herzen anzahl={zustand.wachstum.herzen} />
            </button>
          </span>
          <span className="zimmer-knopf zimmer-geld" aria-label={`${zustand.muenzen} Münzen`}>
            <span className="zimmer-muenze" aria-hidden="true" /> {zustand.muenzen}
          </span>
        </header>

        {spiel === 'feder' && <SpielFederangel katze={katze} onFang={federFang} onEnde={federEnde} />}
        {spiel === 'leckerli' && <SpielLeckerli onEnde={leckerliEnde} />}
        {spiel === 'maus' && <SpielMaeuseloch katze={katze} onTreffer={mausTreffer} onEnde={mausEnde} />}
        {spiel === 'huetchen' && (
          <ErrorBoundary label="Das Hütchenspiel">
            <ShellGame
              onClose={() => { setSpiel(null); pflege('spielen'); }}
              onResult={(delta) => setMuenzen((c) => Math.max(0, c + delta))}
              streak={zustand.huetchenSerie}
              onStreak={zustand.setHuetchenSerie}
              balance={zustand.muenzen}
            />
          </ErrorBoundary>
        )}
        {ergebnis && <div className="zimmer-ergebnis" role="status">{ergebnis}</div>}

        {!spiel && (
        <nav className="zimmer-menue" aria-label="Bereiche">
          {BEREICHE.map((b) => (
            <button key={b.id} className={bereich === b.id ? 'aktiv' : ''} onClick={() => setBereich(b.id)}>
              <Symbol name={b.id} />
              <span>{b.titel}</span>
            </button>
          ))}
        </nav>
        )}

        {!spiel && !bereich && zustand.neueFreischaltungen.length > 0 && (
          <HerzFeier neu={zustand.neueFreischaltungen} name={zustand.name} onWeiter={zustand.freischaltungenGesehen} />
        )}
        {bereich && <Blatt bereich={bereich} zustand={zustand} onZu={() => setBereich(null)} onSpiel={spielStarten} onGekauft={gekauft}
                                  onAngezogen={(a) => setErgebnis(`${a.name} gekauft – ${zustand.name} trägt es`)} />}
      </div>
    </div>
  );
}
