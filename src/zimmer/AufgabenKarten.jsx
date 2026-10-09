import { AUFGABEN, DRUCK, abholbar, aufgabenFuer, fortschritt } from './aufgaben.js';
import { schichtSchluessel } from '../print/schicht.js';

/* Wie viele heutige Aufgaben fertig sind, aber noch nicht abgeholt – für den Knopf im Kopf. */
export const offeneBelohnungen = (aufgaben) => {
  const tag = schichtSchluessel(new Date());
  const stand = aufgaben?.tag === tag ? aufgaben : { tag, zaehler: {}, abgeholt: [] };
  return aufgabenFuer(tag).filter((id) => abholbar(stand, id)).length;
};

/*
  Blatt "Aufgaben" (2.6.0): drei Aufgaben für heute, jeweils mit Fortschritt
  und Lohn, dazu der Stand der Etiketten-Münzen.
*/
export default function AufgabenKarten({ zustand, onLohn }) {
  const tag = schichtSchluessel(new Date());
  const stand = zustand.aufgaben?.tag === tag ? zustand.aufgaben : { tag, zaehler: {}, abgeholt: [] };
  const druck = zustand.druckHeute?.tag === tag ? zustand.druckHeute.summe : 0;
  return (
    <div className="zimmer-aufgaben">
      <ol>
        {aufgabenFuer(tag).map((id) => {
          const a = AUFGABEN[id];
          const f = fortschritt(stand, id);
          const fertig = stand.abgeholt.includes(id);
          const bereit = abholbar(stand, id);
          return (
            <li key={id} className={fertig ? 'fertig' : bereit ? 'bereit' : ''} data-aufgabe={id}>
              <span className="zimmer-aufgabe-text">
                <strong>{a.titel}</strong>
                <span className="zimmer-aufgabe-balken" aria-hidden="true"><span style={{ width: `${(f / a.ziel) * 100}%` }} /></span>
                <small>{f} / {a.ziel}</small>
              </span>
              {fertig ? (
                <span className="zimmer-hat">erledigt</span>
              ) : (
                <button className="zimmer-preis" disabled={!bereit}
                        onClick={() => { const l = zustand.aufgabeAbholen(id); if (l > 0) onLohn(l); }}>
                  abholen <span className="zimmer-muenze" aria-hidden="true" /> {a.lohn}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <p className="zimmer-hinweis">
        Etiketten-Münzen heute: <strong>{druck} / {DRUCK.max}</strong> – jedes gedruckte Etikett bringt eine Münze.
        Morgen gibt es neue Aufgaben.
      </p>
    </div>
  );
}
