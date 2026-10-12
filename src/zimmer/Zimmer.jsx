import { useCallback, useEffect, useRef, useState } from 'react';
import { FREUDE_STREICHELN } from '../cat/tamagotchi.js';
import { FREUNDSCHAFT_STREICHELN } from '../cat/wachstum.js';
import { PLAETZE } from './einrichtung.js';
import { KLO } from './klo.js';
import NamensFeld from '../labels/NamensFeld.jsx';
import EinrichtenKarten from './EinrichtenKarten.jsx';
import Vollbild from './Vollbild.jsx';
import { KleiderschrankKarten, LadenKarten } from './GarderobeKarten.jsx';
import { FreundschaftKarten, HerzFeier } from './Freundschaft.jsx';
import AufgabenKarten, { offeneBelohnungen } from './AufgabenKarten.jsx';
import Szene from './Szene.jsx';
import SpielFederangel from './SpielFederangel.jsx';
import SpielMaeuseloch from './SpielMaeuseloch.jsx';
import ShellGame, { STAKE } from '../ShellGame.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import { launeFuer } from './maeuseloch.js';
import SpielLaser from './SpielLaser.jsx';
import SpielVersteck from './SpielVersteck.jsx';
import SpielMemory from './SpielMemory.jsx';
import { LASER, MEMORY, VERSTECK, abkuehlung, memoryLohn, versteckLohn } from './spiele2.js';
import { BESUCH, besucher, tageszeit, wetter } from './tageszeit.js';
import { FUNDSTUECKE } from './fundstuecke.js';
import SpielLeckerli from './SpielLeckerli.jsx';
import SpielBlasen from './SpielBlasen.jsx';
import SpielNachmachen from './SpielNachmachen.jsx';
import SpielWolle from './SpielWolle.jsx';
import { NACHMACHEN, amBoden, blasenLaune, nachmachenLohn, wolleLaune } from './spiele3.js';
import { ORTE } from './verhalten.js';
import SpielHuepfer from './SpielHuepfer.jsx';
import SpielDreier from './SpielDreier.jsx';
import SpielAngeln from './SpielAngeln.jsx';
import Reise from './reise/Reise.jsx';
import { HUEPFER } from './huepfer.js';
import { FREI, freiLohn } from './reise/frei.js';
import { ANGELN } from './angeln.js';
import { PAUSE_TEXT, pauseAnzeige } from './pause.js';
import { FEDER, LECKERLI, muenzenFuerRunde, wartezeit } from './spiele.js';

const KEY_LECKERLI = 'zimmer_leckerli_zuletzt';
const leckerliZuletzt = () => { try { return localStorage.getItem(KEY_LECKERLI); } catch { return null; } };
// Münzspiele: nach jeder Runde eine kurze Pause (pause.js)
const KEY_VERSTECK = 'zimmer_versteck_zuletzt';
const KEY_MEMORY = 'zimmer_memory_zuletzt';
const KEY_NACHMACHEN = 'zimmer_nachmachen_zuletzt';   // 2.10.0
const KEY_HUEPFER = 'zimmer_huepfer_zuletzt';         // 2.12.0
const KEY_DREIER = 'zimmer_dreier_zuletzt';
const KEY_ANGELN = 'zimmer_angeln_zuletzt';
const zuletzt = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const merken = (key) => { try { localStorage.setItem(key, String(Date.now())); } catch { /* gesperrt */ } };
import useKatzeImZimmer from './useKatzeImZimmer.js';
import './zimmer.css';

/* ── Gezeichnete Symbole (kein Emoji) ─────────────────────────────────────── */
const K = { stroke: '#2f2a26', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' };
const SYMBOLE = {
  fuettern: <g {...K}><path d="M-22 -2 h44 l-6 18 h-32 Z" fill="#ef4444" /><ellipse cx="0" cy="-2" rx="22" ry="6" fill="#a16207" /></g>,
  spielen: <g {...K}><circle r="18" fill="#60a5fa" /><path d="M-17 -5 q17 10 34 0 M-14 10 q14 -8 28 0" fill="none" stroke="#fff" /><circle r="18" fill="none" /></g>,
  laden: <g {...K}><path d="M-10 -10 v-6 a10 10 0 0 1 20 0 v6" fill="none" /><path d="M-18 -10 h36 l-3 30 h-30 Z" fill="#fbbf24" /></g>,
  kleiderschrank: <g {...K} fill="none"><path d="M0 -6 v-4 a6 6 0 1 1 6 -6" /><path d="M0 -6 L-22 10 h44 Z" fill="#c7b8f5" /></g>,
  aufgaben: <g {...K}><rect x="-16" y="-20" width="32" height="40" rx="5" fill="#fde68a" /><rect x="-8" y="-24" width="16" height="8" rx="3" fill="#a16207" /><path d="M-9 -6 l4 4 l8 -8 M-9 8 h18" fill="none" strokeWidth="3.5" /></g>,
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
/* Spielkarte mit Wartezeit (Münzspiele, Pause siehe pause.js). */
function SpielMitPause({ id, titel, text, bild, onSpiel, schluessel }) {
  const warten = abkuehlung(zuletzt(schluessel));
  return (
    <article className="zimmer-karte">
      <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">{bild}</svg>
      <h3>{titel}</h3>
      <p>{text}</p>
      <button className="zimmer-preis" disabled={warten > 0} onClick={() => onSpiel(id)}>spielen</button>
      {warten > 0 && <small>wieder in {pauseAnzeige(warten)}</small>}
    </article>
  );
}

/* Leckerli-Reise: Level ohne Pause (Münzen nur für Neues), daneben das freie Spiel mit Pause. */
function ReiseKarteImBlatt({ onSpiel }) {
  const warten = abkuehlung(zuletzt(KEY_DREIER));
  return (
    <article className="zimmer-karte zimmer-karte-reise">
      <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
        <g {...K} strokeWidth="3">
          <path d="M8 60 C20 40 30 62 42 44 S64 30 72 12" fill="none" strokeDasharray="3 6" />
          {[[10, 58, '#d6a15d'], [40, 46, '#f472b6'], [70, 14, '#60a5fa']].map(([x, y, f]) => <circle key={x} cx={x} cy={y} r="8" fill={f} />)}
          <path d="M66 4 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1 Z" fill="#facc15" strokeWidth="1.5" />
        </g>
      </svg>
      <h3>Leckerli-Reise</h3>
      <p>Match-3 in 30 Leveln: Küche, Garten, Dachboden. Münzen für jedes neue Level und jeden Stern.</p>
      <button className="zimmer-preis" onClick={() => onSpiel('reise')}>Reise</button>
      <button className="zimmer-knopf zimmer-karte-neben" disabled={warten > 0} onClick={() => onSpiel('dreier')}
              title={`Freies Spiel: ${FREI.zuege} Züge, bis ${FREI.lohnMax} Münzen, ${PAUSE_TEXT}`}>
        {warten > 0 ? `frei in ${pauseAnzeige(warten)}` : 'freies Spiel'}
      </button>
    </article>
  );
}

function SpieleKarten({ onSpiel, muenzen }) {
  const warten = wartezeit(leckerliZuletzt());

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
        <p>Napf darunter schieben. Bis zu {LECKERLI.maxMuenzen} Münzen, {PAUSE_TEXT}.</p>
        <button className="zimmer-preis" disabled={warten > 0} onClick={() => onSpiel('leckerli')}>spielen</button>
        {warten > 0 && <small>wieder in {pauseAnzeige(warten)}</small>}
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
      {/* 2.8.0 */}
      <article className="zimmer-karte">
        <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
          <g {...K}><rect x="8" y="40" width="34" height="14" rx="5" fill="#9ca3af" transform="rotate(-20 25 47)" /><path d="M40 38 L66 22" stroke="#ef4444" strokeWidth="3" /><circle cx="68" cy="21" r="6" fill="#ef4444" /></g>
        </svg>
        <h3>Laserpointer</h3>
        <p>Den roten Punkt führen – sie springt drauf. Bringt Laune.</p>
        <button className="zimmer-preis" onClick={() => onSpiel('laser')}>spielen</button>
      </article>
      <SpielMitPause id="versteck" titel="Versteckspiel" onSpiel={onSpiel} schluessel={KEY_VERSTECK}
                     text={`Wo ist sie? ${VERSTECK.lohnJe} Münzen je Fund, ${PAUSE_TEXT}.`}
                     bild={<g {...K}><path d="M10 64 v-36 h60 v36 Z" fill="#d6a15d" /><path d="M10 28 l-6 -10 h60 l6 10" fill="#e7c08a" /><path d="M70 50 q14 -4 12 -20" fill="none" strokeWidth="6" /></g>} />
      <SpielMitPause id="memory" titel="Memory" onSpiel={onSpiel} schluessel={KEY_MEMORY}
                     text={`${MEMORY.paare} Paare Fundstücke. Bis ${MEMORY.lohn[0][1]} Münzen, ${PAUSE_TEXT}.`}
                     bild={<g {...K} strokeWidth="3"><rect x="8" y="14" width="28" height="40" rx="5" fill="#fde68a" /><rect x="44" y="14" width="28" height="40" rx="5" fill="#fff" /><circle cx="58" cy="34" r="8" fill="#a5f3fc" /></g>} />
      {/* 2.10.0 */}
      <article className="zimmer-karte">
        <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
          <g {...K} strokeWidth="3" fill="#e0f2fe" stroke="#0284c7"><circle cx="28" cy="40" r="16" /><circle cx="54" cy="22" r="11" /><circle cx="58" cy="52" r="7" /></g>
        </svg>
        <h3>Seifenblasen</h3>
        <p>Blasen antippen, sie platzen – und sie springt hin. Bringt Laune.</p>
        <button className="zimmer-preis" onClick={() => onSpiel('blasen')}>spielen</button>
      </article>
      <SpielMitPause id="nachmachen" titel="Nachmachen" onSpiel={onSpiel} schluessel={KEY_NACHMACHEN}
                     text={`Sie tippt Kissen an, du machst es nach. ${NACHMACHEN.lohnJe} Münzen je Runde, ${PAUSE_TEXT}.`}
                     bild={<g {...K} strokeWidth="3">{[['#ef4444', 14, 26], ['#3b82f6', 44, 26], ['#22c55e', 14, 52], ['#f59e0b', 44, 52]].map(([f, x, y]) => <ellipse key={f} cx={x + 11} cy={y} rx="13" ry="8" fill={f} />)}</g>} />
      <article className="zimmer-karte">
        <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
          <g {...K} strokeWidth="3"><circle cx="34" cy="38" r="20" fill="#f472b6" /><path d="M18 30 q16 10 32 0 M16 42 q18 10 36 0" fill="none" stroke="#9d174d" strokeWidth="2.5" /><path d="M52 50 q12 8 22 -2" fill="none" /></g>
        </svg>
        <h3>Apportieren</h3>
        <p>Wollknäuel werfen – sie holt es und bringt es zurück. Bringt Laune.</p>
        <button className="zimmer-preis" onClick={() => onSpiel('wolle')}>spielen</button>
      </article>
      {/* 2.12.0: drei grössere Münzspiele */}
      <SpielMitPause id="huepfer" titel="Gurkenhüpfer" onSpiel={onSpiel} schluessel={KEY_HUEPFER}
                     text={`Über Gurken springen, Münzen sammeln. Bis ${HUEPFER.lohnMax} Münzen, ${PAUSE_TEXT}.`}
                     bild={<g {...K} strokeWidth="3"><path d="M8 58 C6 44 46 40 48 54 C50 64 10 70 8 58 Z" fill="#4ade80" /><circle cx="56" cy="20" r="9" fill="#fbbf24" /><path d="M20 34 q14 -22 28 -12" fill="none" strokeDasharray="4 5" /></g>} />
      {/* 2.13.0: Leckerli-Drei wird zur Reise mit 30 Leveln; das freie Spiel bleibt */}
      <ReiseKarteImBlatt onSpiel={onSpiel} />
      <SpielMitPause id="angeln" titel="Angeln" onSpiel={onSpiel} schluessel={KEY_ANGELN}
                     text={`Haken auswerfen, Fische hochziehen – der Goldfisch zählt achtfach. Bis ${ANGELN.lohnMax} Münzen, ${PAUSE_TEXT}.`}
                     bild={<g {...K} strokeWidth="3"><rect x="2" y="38" width="76" height="30" rx="6" fill="#38bdf8" /><path d="M40 4 V40" stroke="#f8fafc" strokeWidth="2" /><path d="M40 40 v6 a4 4 0 1 1 -6 2" fill="none" /><ellipse cx="22" cy="56" rx="10" ry="6" fill="#facc15" /></g>} />
    </div>
  );
}

function Blatt({ bereich, zustand, onZu, onSpiel, onGekauft, onAngezogen, onLohn }) {
  const titel = BEREICHE.find((b) => b.id === bereich)?.titel ?? ({ herzen: 'Freundschaft', aufgaben: 'Aufgaben für heute' }[bereich] ?? '');
  return (
    <div className="zimmer-blatt-huelle" onClick={onZu}>
      <section className="zimmer-blatt" role="dialog" aria-label={titel} onClick={(e) => e.stopPropagation()}>
        <div className="zimmer-blatt-griff" />
        <header className="zimmer-blatt-kopf">
          <Symbol name={bereich} groesse={40} />
          <h2>{titel}</h2>
          {bereich === 'fuettern' && (
            <span className="zimmer-blatt-info">Napf {Math.round(zustand.napf)} % · Wasser {zustand.moebel.has('trinkbrunnen') ? 'Brunnen' : `${Math.round(zustand.wasser)} %`}</span>
          )}
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
            ) : null}
            {/* Wasser (2.5.0): kostenlos, aber die Schale will aufgefüllt werden */}
            <article className={`zimmer-karte ${zustand.wasser <= 0 && !zustand.moebel.has('trinkbrunnen') ? 'zimmer-karte-wichtig' : ''}`}>
              <svg viewBox="0 0 80 70" className="zimmer-karte-bild" aria-hidden="true">
                <path d="M40 8 C26 28 22 36 22 42 a18 18 0 0 0 36 0 c0 -6 -4 -14 -18 -34 Z" fill="#60a5fa" {...K} />
              </svg>
              <h3>Wasser</h3>
              {zustand.moebel.has('trinkbrunnen') ? (
                <p>Der Trinkbrunnen ist immer voll.</p>
              ) : (
                <>
                  <p>Schale {Math.round(zustand.wasser)} % voll – Auffüllen ist kostenlos.</p>
                  <button className="zimmer-preis" disabled={zustand.wasser >= 100} onClick={zustand.wasserAuffuellen}>auffüllen</button>
                </>
              )}
            </article>
          </div>
        ) : bereich === 'spielen' ? (
          <SpieleKarten onSpiel={onSpiel} muenzen={zustand.muenzen} />
        ) : bereich === 'einrichten' ? (
          <EinrichtenKarten zustand={zustand} onGekauft={onGekauft} />
        ) : bereich === 'aufgaben' ? (
          <AufgabenKarten zustand={zustand} onLohn={onLohn} />
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
  const spielRef = useRef(spiel);
  spielRef.current = spiel;
  // Tippt man gleich nach dem Öffnen etwas an, gewinnt der Tipp gegen die Begrüssung
  const begruessungRef = useRef([]);
  const begruessungAbbrechen = () => { begruessungRef.current.forEach(clearTimeout); begruessungRef.current = []; };
  const [ergebnis, setErgebnis] = useState(null);

  const spielStarten = (art) => {
    begruessungAbbrechen();
    setBereich(null);
    if (art === 'leckerli') {
      try { localStorage.setItem(KEY_LECKERLI, String(Date.now())); } catch { /* gesperrt */ }
    }
    if (art === 'versteck') merken(KEY_VERSTECK);
    if (art === 'memory') merken(KEY_MEMORY);
    if (art === 'nachmachen') merken(KEY_NACHMACHEN);
    if (art === 'huepfer') merken(KEY_HUEPFER);
    if (art === 'dreier') merken(KEY_DREIER);
    if (art === 'angeln') merken(KEY_ANGELN);
    setSpiel(art);
  };

  const { erfreuen, naeher, setMuenzen, name, pflege, zaehle } = zustand;
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
    zaehle('leckerli', faenge);
    const muenzen = muenzenFuerRunde(faenge);
    if (muenzen > 0) setMuenzen((c) => c + muenzen);
    setErgebnis(muenzen > 0 ? `+${muenzen} Münzen` : 'Diesmal nichts gefangen');
  }, [freigeben, setMuenzen, pflege, zaehle]);
  const mausEnde = useCallback((treffer) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    zaehle('maeuse', treffer);
    if (treffer > 0) {
      erfreuen(launeFuer(treffer));
      naeher('spielen', 1);
    }
    setErgebnis(treffer > 0 ? `${treffer} ${treffer === 1 ? 'Maus' : 'Mäuse'} – ${name} ist ganz aufgedreht` : 'Die Mäuse waren zu flink');
  }, [freigeben, pflege, erfreuen, naeher, name, zaehle]);
  const mausTreffer = useCallback(() => setHerzchen((n) => n + 1), []);

  // 2.8.0: Laserpointer (Laune), Versteckspiel und Memory (Münzen)
  const laserEnde = useCallback((spruenge) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    if (spruenge > 0) {
      erfreuen(Math.min(LASER.launeMax, spruenge * LASER.laune));
      naeher('spielen', 1);
    }
    setErgebnis(spruenge > 0 ? `${spruenge} ${spruenge === 1 ? 'Sprung' : 'Sprünge'} – ${name} ist ganz aus dem Häuschen` : 'Der Punkt war zu schnell');
  }, [freigeben, pflege, erfreuen, naeher, name]);
  const versteckEnde = useCallback((funde) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    const lohn = versteckLohn(funde);
    if (lohn > 0) setMuenzen((c) => c + lohn);
    setErgebnis(lohn > 0 ? `${funde}-mal gleich gefunden: +${lohn} Münzen` : `${name} hat sich gut versteckt`);
  }, [freigeben, pflege, setMuenzen, name]);
  const memoryEnde = useCallback((zuege) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    if (zuege === null) { setErgebnis('Memory abgebrochen'); return; }
    const lohn = memoryLohn(zuege);
    setMuenzen((c) => c + lohn);
    setErgebnis(`Alle Paare in ${zuege} Zügen: +${lohn} Münzen`);
  }, [freigeben, pflege, setMuenzen]);

  // 2.10.0: Seifenblasen und Apportieren (Laune), Nachmachen (Münzen)
  const blasenEnde = useCallback((n) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    if (n > 0) {
      erfreuen(blasenLaune(n));
      naeher('spielen', 1);
    }
    setErgebnis(n > 0 ? `${n} ${n === 1 ? 'Blase' : 'Blasen'} geplatzt – ${name} ist ganz zappelig` : 'Die Blasen sind davongeflogen');
  }, [freigeben, pflege, erfreuen, naeher, name]);
  const nachmachenEnde = useCallback((runden) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    const lohn = nachmachenLohn(runden);
    if (lohn > 0) setMuenzen((c) => c + lohn);
    setErgebnis(lohn > 0 ? `${runden} ${runden === 1 ? 'Runde' : 'Runden'} nachgemacht: +${lohn} Münzen` : `${name} war zu schnell`);
  }, [freigeben, pflege, setMuenzen, name]);
  const wolleEnde = useCallback((n) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    if (n > 0) {
      erfreuen(wolleLaune(n));
      naeher('spielen', 1);
    }
    setErgebnis(n > 0 ? `${n}-mal gebracht – ${name} ist stolz` : `${name} hat das Knäuel liegen lassen`);
  }, [freigeben, pflege, erfreuen, naeher, name]);

  // 2.12.0: Gurkenhüpfer, Leckerli-Drei, Angeln (Münzen)
  const muenzSpielEnde = useCallback((lohn, text) => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
    if (lohn > 0) {
      setMuenzen((c) => c + lohn);
      naeher('spielen', 1);
    }
    setErgebnis(lohn > 0 ? `${text}: +${lohn} Münzen` : text);
  }, [freigeben, pflege, setMuenzen, naeher]);
  const huepferEnde = useCallback((r) => muenzSpielEnde(r.lohn, `${r.meter} m gerannt, ${r.muenzen} Münzen gesammelt`), [muenzSpielEnde]);
  const dreierEnde = useCallback((punkte) => muenzSpielEnde(freiLohn(punkte), `${punkte} Punkte`), [muenzSpielEnde]);
  const reiseLohn = useCallback((lohn) => {
    setMuenzen((c) => c + lohn);
    naeher('spielen', 1);
  }, [setMuenzen, naeher]);
  const reiseZu = useCallback(() => {
    setSpiel(null);
    freigeben();
    pflege('spielen');
  }, [freigeben, pflege]);
  const angelnEnde = useCallback((r) => muenzSpielEnde(r.lohn, `${r.fische} ${r.fische === 1 ? 'Fang' : 'Fänge'}, ${r.punkte} Punkte`), [muenzSpielEnde]);

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
    // Läuft schon ein Spiel, führt das Spiel sie – dann nicht dazwischenfunken
    const weiter = setTimeout(() => { if (!spielRef.current) freigebenKatze(); }, 2600);
    begruessungRef.current = [hin, weiter];
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

  // Tipp auf die Wasserschale: auffüllen, mit kurzer Meldung
  const wasserAuffuellen = () => {
    if (zustand.wasserAuffuellen()) setErgebnis('Frisches Wasser – danke!');
  };

  // 2.10.0: Kuscheln (lange drücken), Locken (Boden), Fenster und Aquarium antippen
  const [schnurrt, setSchnurrt] = useState(false);
  const [tipp, setTipp] = useState(null);
  const [fischeErschreckt, setFischeErschreckt] = useState(false);
  useEffect(() => {
    if (!schnurrt) return undefined;
    const t = setTimeout(() => setSchnurrt(false), 2600);
    return () => clearTimeout(t);
  }, [schnurrt]);
  useEffect(() => {
    if (!tipp) return undefined;
    const t = setTimeout(() => setTipp(null), 700);
    return () => clearTimeout(t);
  }, [tipp]);
  useEffect(() => {
    if (!fischeErschreckt) return undefined;
    const t = setTimeout(() => setFischeErschreckt(false), 1400);
    return () => clearTimeout(t);
  }, [fischeErschreckt]);
  const { tue } = katze;
  const kuscheln = () => {
    begruessungAbbrechen();
    setSchnurrt(true);
    tue(null, 'treteln', 2600);
    zustand.pflege('streicheln');
    zustand.erfreuen(FREUDE_STREICHELN);
    zustand.naeher('streicheln', FREUNDSCHAFT_STREICHELN);
    setHerzchen((n) => n + 1);
  };
  const locken = (p) => {
    begruessungAbbrechen();
    const ziel = amBoden(p);
    setTipp({ id: Date.now(), x: ziel.x, y: ziel.y });
    tue({ ...ziel, richtung: ziel.x < katze.pos.x ? -1 : 1 }, 'kopfschief', 2600);
  };
  const ansFenster = () => {
    begruessungAbbrechen();
    tue(ORTE.fensterbank, 'schnattern', 5_000);
    if (!besuch) {
      const id = Date.now();
      setBesuch({ id, art: besucher(zeit) });
      setTimeout(() => setBesuch((b) => (b?.id === id ? null : b)), BESUCH.dauer);
    }
  };
  const ansAquarium = () => {
    begruessungAbbrechen();
    setFischeErschreckt(true);
    tue(ORTE.aquarium, 'fische', 8_000);
  };

  const streicheln = () => {
    if (zustand.kann('rollen')) setRollt(true);
    zustand.pflege('streicheln');
    zustand.erfreuen(FREUDE_STREICHELN);
    zustand.naeher('streicheln', FREUNDSCHAFT_STREICHELN);
    setHerzchen((n) => n + 1);
  };

  return (
    <div className={`zimmer ${['versteck', 'huepfer', 'angeln'].includes(spiel) ? 'katze-versteckt' : ''}`} role="dialog" aria-label="Katzenzimmer">
      <div className="zimmer-buehne">
        <Szene moebel={zustand.moebel} frei={zustand.frei} napf={zustand.napf} katze={katze}
               klo={zustand.klo} kloVoll={zustand.klo >= KLO.kapazitaet} haeufchen={zustand.haeufchen}
               fell={zustand.fell} zubehoer={zustand.angelegt} onKatze={streicheln} onPutzen={putzen}
               neu={neuesMoebel} onFrei={() => setBereich('einrichten')}
               geschenk={zustand.geschenkHeute} onGeschenk={geschenkOeffnen} rollt={rollt}
               tageszeit={zeit} besuch={besuch} fund={zustand.fundOffen} onFund={fundAufheben}
               groesse={zustand.wachstum.phase.groesse}
               wasser={zustand.wasser} onNapf={() => setBereich('fuettern')} onWasser={wasserAuffuellen}
               wetterArt={wetter(new Date(zustand.jetzt))} ball={zustand.ball} springt={katze.springt}
               sonnig={['morgen', 'tag'].includes(zeit) && wetter(new Date(zustand.jetzt)) === 'sonne'}
               onBoden={locken} onFenster={ansFenster} onAquarium={ansAquarium} onKatzeLang={kuscheln}
               schnurrt={schnurrt} fischeErschreckt={fischeErschreckt} tipp={tipp} />

        {lohnPops.map((p) => (
          <span key={p.id} className="zimmer-lohn" aria-hidden="true"
                style={{
                  left: `${p.x / 10.24}%`, top: `${(p.y - 40) / 7.68}%`,
                  // Ziel: die Münzanzeige oben rechts (Bühne ist 100 × 75 cqw)
                  // Münzanzeige steht am Bildschirmrand, links vom Vollbild-Knopf
                  '--zum-x': `calc(${88 - p.x / 10.24}cqw + var(--rand-x))`,
                  '--zum-y': `calc(${(5 - (p.y - 40) / 7.68) * 0.75}cqw - var(--rand-y))`,
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
          {/* Aufgaben für heute; die Zahl zeigt fertige, noch nicht abgeholte */}
          <button className="zimmer-knopf zimmer-aufgaben-knopf" onClick={() => setBereich('aufgaben')}
                  aria-label={`Aufgaben für heute${offeneBelohnungen(zustand.aufgaben) ? ` – ${offeneBelohnungen(zustand.aufgaben)} zum Abholen` : ''}`}>
            <Symbol name="aufgaben" groesse={30} />
            {offeneBelohnungen(zustand.aufgaben) > 0 && <span className="zimmer-abzeichen">{offeneBelohnungen(zustand.aufgaben)}</span>}
          </button>
          <Vollbild />
        </header>

        {spiel === 'feder' && <SpielFederangel katze={katze} onFang={federFang} onEnde={federEnde} />}
        {spiel === 'leckerli' && <SpielLeckerli onEnde={leckerliEnde} />}
        {spiel === 'maus' && <SpielMaeuseloch katze={katze} onTreffer={mausTreffer} onEnde={mausEnde} />}
        {spiel === 'laser' && <SpielLaser katze={katze} onSprung={mausTreffer} onEnde={laserEnde} />}
        {spiel === 'versteck' && <SpielVersteck fell={zustand.fell} onEnde={versteckEnde} />}
        {spiel === 'memory' && <SpielMemory onEnde={memoryEnde} />}
        {spiel === 'blasen' && <SpielBlasen katze={katze} onPlatzt={mausTreffer} onEnde={blasenEnde} />}
        {spiel === 'nachmachen' && <SpielNachmachen katze={katze} onEnde={nachmachenEnde} />}
        {spiel === 'wolle' && <SpielWolle katze={katze} onGebracht={mausTreffer} onEnde={wolleEnde} />}
        {spiel === 'huepfer' && <SpielHuepfer fell={zustand.fell} zubehoer={zustand.angelegt} onEnde={huepferEnde} />}
        {spiel === 'dreier' && <SpielDreier onEnde={dreierEnde} />}
        {spiel === 'reise' && <Reise fell={zustand.fell} onLohn={reiseLohn} onZu={reiseZu} />}
        {spiel === 'angeln' && <SpielAngeln fell={zustand.fell} onEnde={angelnEnde} />}
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
        {bereich && <Blatt bereich={bereich} zustand={zustand} onZu={() => setBereich(null)} onSpiel={spielStarten} onGekauft={gekauft} onLohn={(l) => setErgebnis(`+${l} Münzen – gut gemacht!`)}
                                  onAngezogen={(a) => setErgebnis(`${a.name} gekauft – ${zustand.name} trägt es`)} />}
      </div>
    </div>
  );
}
