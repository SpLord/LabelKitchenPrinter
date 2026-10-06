import { FREISCHALTUNGEN } from './herzen.js';
import { FUNDSTUECKE } from './fundstuecke.js';
import { FundstueckBild } from './Fensterwelt.jsx';

const HERZ = 'M0 4 C-6 -6 -18 -2 -14 8 C-11 15 0 20 0 20 C0 20 11 15 14 8 C18 -2 6 -6 0 4 Z';

const Herz = ({ voll = true, groesse = 28 }) => (
  <svg viewBox="-18 -8 36 30" width={groesse} height={groesse * 0.83} aria-hidden="true">
    <path d={HERZ} fill={voll ? '#ef4444' : '#fff'} stroke="#2f2a26" strokeWidth="3" />
  </svg>
);

/*
  Neues Herz! Einmal je Freischaltung, nicht während eines Spiels oder mit
  offenem Blatt. Sagt, WAS jetzt neu ist – ein Herz ohne Folge wäre nur Deko.
*/
export function HerzFeier({ neu, name, onWeiter }) {
  const letzte = neu[neu.length - 1];
  return (
    <div className="zimmer-feier-huelle" role="dialog" aria-label="Neues Herz">
      <div className="zimmer-feier">
        <div className="zimmer-feier-herz"><Herz groesse={96} /></div>
        <h2>{neu.length > 1 ? `${neu.length} neue Herzen!` : 'Neues Herz!'}</h2>
        <ul>
          {neu.map((f) => (
            <li key={f.id}><strong>{f.titel}</strong> – {f.text.replace('Sie ', `${name} `)}</li>
          ))}
        </ul>
        <button className="zimmer-preis" onClick={onWeiter} autoFocus>
          {letzte.herz === 5 ? 'Beste Freunde!' : 'Schön!'}
        </button>
      </div>
    </div>
  );
}

/* Blatt "Freundschaft": was jedes Herz bringt, was schon frei ist. */
export function FreundschaftKarten({ herzen, gefunden = [] }) {
  return (
    <div className="zimmer-freundschaft">
      <ol>
        {FREISCHALTUNGEN.map((f) => {
          const da = herzen >= f.herz;
          return (
            <li key={f.id} className={da ? 'da' : 'zu'} data-freischaltung={f.id}>
              <span className="zimmer-freundschaft-herzen" aria-label={`${f.herz} Herzen`}>
                {Array.from({ length: f.herz }, (_, i) => <Herz key={i} voll={da} groesse={20} />)}
              </span>
              <span>
                <strong>{f.titel}</strong>
                <small>{f.text}</small>
              </span>
              <span className="zimmer-freundschaft-stand">{da ? 'frei' : 'noch zu'}</span>
            </li>
          );
        })}
      </ol>
      <h3 className="zimmer-abschnitt zimmer-album-titel">Fundstücke-Album · {gefunden.length} von {FUNDSTUECKE.length}</h3>
      <div className="zimmer-album">
        {FUNDSTUECKE.map((f) => {
          const da = gefunden.includes(f.id);
          return (
            <figure key={f.id} className={da ? 'da' : 'fehlt'} data-album={f.id}>
              <svg viewBox="-26 -26 52 52" aria-hidden="true"><FundstueckBild id={f.id} /></svg>
              <figcaption>{da ? f.name : '?'}</figcaption>
            </figure>
          );
        })}
      </div>
      <p className="zimmer-hinweis">
        Freundschaft wächst mit Streicheln, Spielen und Füttern – jeden Tag ein Stück, und ein gut versorgter Tag zählt extra.
      </p>
    </div>
  );
}
