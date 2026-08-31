import { FELLE, ZUBEHOER, artikel, fortschritt, istAngelegt } from './laden.js';

/*
  Katzenladen.
  - props:
    - muenzen, besitz, angelegt
    - onKaufen(id), onUmschalten(id), onClose
*/
export default function Katzenladen({ muenzen, besitz, angelegt, onKaufen, onUmschalten, onClose }) {
  const stand = fortschritt(besitz);

  const zeile = (a) => {
    const gekauft = besitz.includes(a.id);
    const getragen = gekauft && istAngelegt(angelegt, a.id);
    const fehlt = a.preis - muenzen;

    return (
      <li key={a.id} className={`laden-zeile ${gekauft ? 'gekauft' : ''}`}>
        <span className="laden-name">
          {a.emoji ? <span aria-hidden="true">{a.emoji} </span> : null}
          {a.name}
        </span>

        {gekauft ? (
          <button
            className={`laden-knopf ${getragen ? 'getragen' : ''}`}
            onClick={() => onUmschalten(a.id)}
          >
            {getragen ? '✓ angelegt' : 'anlegen'}
          </button>
        ) : (
          <button
            className="laden-knopf kaufen"
            onClick={() => onKaufen(a.id)}
            disabled={fehlt > 0}
            title={fehlt > 0 ? `Es fehlen noch ${fehlt} Münzen` : `Für ${a.preis} Münzen kaufen`}
          >
            {a.preis} 🪙
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="gimmick-panel top laden" onClick={(e) => e.stopPropagation()}>
      <div className="gimmick-title">🛍️ Katzenladen</div>

      <p className="laden-stand">
        {stand.gekauft} von {stand.gesamt} · {stand.ausgegeben} 🪙 ausgegeben
        <br />
        <span className="laden-kasse">Kontostand: {muenzen} 🪙</span>
      </p>

      <div className="laden-abschnitt">Fell</div>
      <ul className="laden-liste">{FELLE.map(zeile)}</ul>

      <div className="laden-abschnitt">Zubehör</div>
      <ul className="laden-liste">{ZUBEHOER.map(zeile)}</ul>

      <p className="laden-hinweis">
        Gekauftes bleibt dauerhaft. Anlegen und Abnehmen kosten nichts, und es lässt
        sich jederzeit wechseln.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button onClick={onClose}>Schließen</button>
      </div>
    </div>
  );
}

export { artikel };
