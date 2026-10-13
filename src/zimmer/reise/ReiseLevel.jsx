import { useEffect, useRef, useState } from 'react';
import BrettAnsicht, { PfotenKnopf } from './BrettAnsicht.jsx';
import Feld, { BILD } from './Feld.jsx';
import useBrettSpiel from './useBrettSpiel.js';
import { rausch, startBrett } from './brett.js';
import { WELTEN, anfang, geschafft, sterne as sterneFuer, zielStand } from './level.js';

const K = { stroke: '#2f2a26', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };

export const Stern = ({ an = true, groesse = '1em' }) => (
  <svg viewBox="-12 -12 24 24" width={groesse} height={groesse} aria-hidden="true" className={`reise-stern ${an ? 'an' : ''}`}>
    <path d="M0 -10 L3 -3.5 L10 -3 L4.6 1.8 L6.2 9 L0 5.2 L-6.2 9 L-4.6 1.8 L-10 -3 L-3 -3.5 Z" fill={an ? '#facc15' : '#e5e7eb'} {...K} strokeWidth="2" />
  </svg>
);

/* Kleines Bild je Ziel, im selben 40er-Feld wie die Leckerli. */
function ZielBild({ ziel }) {
  if (ziel.typ === 'sammeln') return BILD[ziel.art];
  if (ziel.typ === 'kisten') return <Feld feld={{ art: 'kiste', leben: 1 }} />;
  if (ziel.typ === 'dosen') return BILD.dose;
  if (ziel.typ === 'pfuetzen') return <g {...K}><path d="M-16 4 C-18 -8 -2 -12 4 -8 C14 -12 20 0 14 8 C8 16 -14 14 -16 4 Z" fill="#f8fafc" /><circle cx="-4" cy="0" r="3" fill="#e0f2fe" stroke="none" /></g>;
  return <g transform="scale(1.4)"><path d="M0 -10 L3 -3.5 L10 -3 L4.6 1.8 L6.2 9 L0 5.2 L-6.2 9 L-4.6 1.8 L-10 -3 L-3 -3.5 Z" fill="#facc15" {...K} strokeWidth="1.6" /></g>;
}
const zielText = (z) => ({
  punkte: `${z.n} Punkte`, sammeln: `${z.n} sammeln`, pfuetzen: 'Alle Pfützen weg', kisten: 'Alle Kisten kaputt', dosen: 'Alle Dosen nach unten',
}[z.typ]);

/*
  Ein Level: Startbild mit Zielen → spielen → bei Erfolg zählen die
  übrigen Züge als Bonus → Endbild mit Sternen und Münzen.
  onErgebnis(sterne, punkte) trägt ein und liefert die Münzen (0, wenn
  schon so gut geschafft).
*/
export default function ReiseLevel({ level, rekord = 0, besteSterne = 0, onErgebnis, onKarte, onNochmal, onWeiter }) {
  const [startS] = useState(() => startBrett(level.vorlage, level.arten));
  const anfangRef = useRef(anfang(startS));
  const [phase, setPhase] = useState('start');   // start | spiel | bonus | gewonnen | verloren
  const [zuege, setZuege] = useState(level.zuege);
  const [stand, setStand] = useState({ punkte: 0, gesammelt: {} });
  const [ende, setEnde] = useState(null);
  const eingetragenRef = useRef(false);

  const [rauschPunkte, setRauschPunkte] = useState(0);
  const spiel = useBrettSpiel(() => startS, level.arten, (r, sNeu, { ohneZug }) => {
    const gesammelt = { ...stand.gesammelt };
    Object.entries(r.gesammelt).forEach(([k, n]) => { gesammelt[k] = (gesammelt[k] ?? 0) + n; });
    const neu = { punkte: stand.punkte + r.punkte, gesammelt };
    const rest = ohneZug ? zuege : zuege - 1;
    setStand(neu);
    setZuege(rest);
    if (geschafft(zielStand(level, neu, sNeu, anfangRef.current))) setPhase('bonus');
    else if (rest <= 0) setPhase('verloren');
  }, phase !== 'spiel');

  const staende = zielStand(level, stand, spiel.s, anfangRef.current);
  const bonus = rauschPunkte;
  const gesamt = stand.punkte + bonus;

  // Leckerli-Rausch: die übrigen Züge zünden als gestreifte Leckerli, dann eintragen (genau einmal)
  const { abspielen, s: brettJetzt } = spiel;
  const rauschRef = useRef(false);
  useEffect(() => {
    if (phase !== 'bonus' || rauschRef.current) return;
    rauschRef.current = true;
    (async () => {
      await new Promise((r) => { setTimeout(r, 700); });
      const r = rausch(brettJetzt, zuege, level.arten);
      if (r.schritte.length) {
        await abspielen(r);
        setRauschPunkte(r.punkte);
      }
      const endpunkte = stand.punkte + r.punkte;
      const st = sterneFuer(level, endpunkte, true);
      const lohn = eingetragenRef.current ? 0 : onErgebnis(st, endpunkte);
      eingetragenRef.current = true;
      await new Promise((res) => { setTimeout(res, 500); });
      setZuege(0);
      setEnde({ sterne: st, lohn, punkte: endpunkte });
      setPhase('gewonnen');
    })();
  }, [phase, brettJetzt, zuege, level, stand.punkte, abspielen, onErgebnis]);
  useEffect(() => {
    if (phase !== 'verloren' || eingetragenRef.current) return;
    eingetragenRef.current = true;
    onErgebnis(0, stand.punkte);
  }, [phase, stand.punkte, onErgebnis]);

  const welt = WELTEN.find((w) => w.id === level.welt);
  const balken = Math.min(1, gesamt / level.sterne[1]);
  return (
    <div className="reise-level" style={{ '--welt': welt.farbe }} data-reise-level={level.nr} data-reise-phase={phase}>
      <div className="reise-spielfeld">
        <BrettAnsicht spiel={spiel} />
        <aside className="reise-seite">
          <div className="reise-levelnr">{welt.name} · Level {level.nr}</div>
          <div className="reise-zuege" data-reise-zuege={zuege}><strong>{zuege}</strong><span>{zuege === 1 ? 'Zug' : 'Züge'}</span></div>
          <ul className="reise-ziele">
            {staende.map((z, k) => (
              <li key={k} className={z.fertig ? 'fertig' : ''} data-ziel={z.ziel.typ}>
                <svg viewBox="-20 -20 40 40" aria-hidden="true"><ZielBild ziel={z.ziel} /></svg>
                <span>{z.fertig
                  // Gezeichnet statt "✓": nicht jede Schrift auf dem Tablet hat das Zeichen
                  ? <svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-label="geschafft" role="img"><path d="M4 10.5 l4 4 l8 -9" fill="none" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : `${z.ist} / ${z.soll}`}</span>
              </li>
            ))}
          </ul>
          <div className="reise-punkte">
            <strong>{gesamt}</strong> Punkte{bonus > 0 && <small> (+{bonus} Rausch)</small>}
            <div className="reise-balken" aria-hidden="true">
              <span style={{ width: `${balken * 100}%` }} />
              <i style={{ left: `${(level.sterne[0] / level.sterne[1]) * 100}%` }} /><i style={{ left: '100%' }} />
            </div>
          </div>
          <div className="reise-werkzeug">
            <PfotenKnopf spiel={spiel} />
            <button className="zimmer-knopf reise-aufgeben" onClick={onKarte}>Karte</button>
          </div>
        </aside>
      </div>

      {phase === 'start' && (
        <div className="reise-tafel" role="dialog" aria-label={`Level ${level.nr}`}>
          <h2>Level {level.nr}</h2>
          <div className="reise-tafel-sterne">{[1, 2, 3].map((n) => <Stern key={n} an={besteSterne >= n} groesse="2.4em" />)}</div>
          <ul className="reise-tafel-ziele">
            {level.ziele.map((z, k) => (
              <li key={k}><svg viewBox="-20 -20 40 40" aria-hidden="true"><ZielBild ziel={z} /></svg>{zielText(z)}</li>
            ))}
          </ul>
          <p className="reise-tafel-zuege">in {level.zuege} Zügen</p>
          {level.tipp && <p className="reise-tipp">💡 {level.tipp}</p>}
          {rekord > 0 && <p className="reise-rekord">Rekord: {rekord} Punkte</p>}
          <button className="zimmer-preis reise-los" onClick={() => setPhase('spiel')}>Los!</button>
        </div>
      )}
      {phase === 'bonus' && <div className="reise-geschafft-schild" role="status">{zuege > 0 ? 'Geschafft! Leckerli-Rausch!' : 'Geschafft!'}</div>}
      {phase === 'gewonnen' && ende && (
        <div className="reise-tafel gewonnen" role="dialog" aria-label="Level geschafft">
          <h2>Geschafft!</h2>
          <div className="reise-tafel-sterne">
            {[1, 2, 3].map((n) => <span key={n} className="reise-stern-pop" style={{ animationDelay: `${n * 0.25}s` }}><Stern an={ende.sterne >= n} groesse="3.4em" /></span>)}
          </div>
          <p className="reise-tafel-punkte"><strong>{ende.punkte}</strong> Punkte{ende.punkte > rekord && rekord > 0 ? ' – neuer Rekord!' : ''}</p>
          <p className="reise-lohn" data-reise-lohn={ende.lohn}>
            {ende.lohn > 0 ? <><span className="zimmer-muenze" aria-hidden="true" /> +{ende.lohn} Münzen</> : 'Münzen gibt es nur für neue Sterne'}
          </p>
          <div className="reise-knoepfe">
            <button className="zimmer-knopf" onClick={onKarte}>Karte</button>
            <button className="zimmer-knopf" onClick={onNochmal}>Nochmal</button>
            {onWeiter && <button className="zimmer-preis" onClick={onWeiter}>Weiter →</button>}
          </div>
        </div>
      )}
      {phase === 'verloren' && (
        <div className="reise-tafel verloren" role="dialog" aria-label="Keine Züge mehr">
          <h2>Keine Züge mehr</h2>
          <ul className="reise-tafel-ziele">
            {staende.map((z, k) => (
              <li key={k} className={z.fertig ? 'fertig' : ''}><svg viewBox="-20 -20 40 40" aria-hidden="true"><ZielBild ziel={z.ziel} /></svg>{z.fertig ? 'geschafft' : `${z.ist} von ${z.soll}`}</li>
            ))}
          </ul>
          <p>So knapp – versuch&apos;s gleich nochmal.</p>
          <div className="reise-knoepfe">
            <button className="zimmer-knopf" onClick={onKarte}>Karte</button>
            <button className="zimmer-preis" onClick={onNochmal}>Nochmal</button>
          </div>
        </div>
      )}
    </div>
  );
}
