import CatVariant from '../cat/CatVariant.jsx';
import { FELLE, ZUBEHOER, istAngelegt } from '../cat/laden.js';

/*
  Laden und Kleiderschrank (Etappe 4) – im selben Blatt wie Füttern und
  Einrichten, mit Vorschau an der eigenen Katze: Zubehör sieht man an ihr
  im aktuellen Fell, Felle zeigen sie im neuen Fell. Man weiss vor dem Kauf,
  wie es aussieht.

  Felle und Zubehör sind die langen Ziele; Möbel stehen unter Einrichten.
*/

const NACH_PREIS = (a, b) => a.preis - b.preis;
const ZUBEHOER_REIHE = [...ZUBEHOER].sort(NACH_PREIS);
const FELL_REIHE = [...FELLE].sort(NACH_PREIS);

function Vorschau({ fell, zubehoer, gross = false }) {
  return (
    <svg viewBox="-10 -10 220 215" className={gross ? 'zimmer-vorschau-gross' : 'zimmer-karte-bild'} aria-hidden="true">
      <CatVariant index={fell} active={false} zubehoer={zubehoer} />
    </svg>
  );
}

function LadenKarte({ a, zustand, onGekauft }) {
  const fell = a.variante ?? zustand.fell;
  const zubehoer = a.variante === undefined ? { [a.id]: true } : {};
  const hat = zustand.besitz.includes(a.id);
  const zuTeuer = zustand.muenzen < a.preis;
  return (
    <article className={`zimmer-karte zimmer-karte-klein ${hat ? 'zimmer-karte-hat' : ''}`} data-artikel={a.id}>
      <Vorschau fell={fell} zubehoer={zubehoer} />
      <h3>{a.name}</h3>
      {hat ? (
        <span className="zimmer-hat">im Schrank</span>
      ) : (
        <button className="zimmer-preis" disabled={zuTeuer}
                onClick={() => { if (zustand.kaufen(a.id)) onGekauft(a); }}>
          <span className="zimmer-muenze" aria-hidden="true" /> {a.preis}
        </button>
      )}
    </article>
  );
}

export function LadenKarten({ zustand, onGekauft }) {
  return (
    <>
      <h3 className="zimmer-abschnitt">Zubehör</h3>
      <div className="zimmer-karten zimmer-karten-klein">
        {ZUBEHOER_REIHE.map((a) => <LadenKarte key={a.id} a={a} zustand={zustand} onGekauft={onGekauft} />)}
      </div>
      <h3 className="zimmer-abschnitt">Felle</h3>
      <div className="zimmer-karten zimmer-karten-klein">
        {FELL_REIHE.map((a) => <LadenKarte key={a.id} a={a} zustand={zustand} onGekauft={onGekauft} />)}
      </div>
      <p className="zimmer-hinweis">Gekauftes zieht sie gleich an. Wechseln geht kostenlos im Kleiderschrank.</p>
    </>
  );
}

/* Kleiderschrank: anprobieren und ablegen, kostenlos. */
export function KleiderschrankKarten({ zustand }) {
  const felle = FELL_REIHE.filter((f) => zustand.besitz.includes(f.id));
  const teile = ZUBEHOER_REIHE.filter((z) => zustand.besitz.includes(z.id));
  const fellAn = (id) => istAngelegt(zustand.angelegt, id);
  return (
    <div className="zimmer-schrank">
      <div className="zimmer-schrank-spiegel">
        <Vorschau fell={zustand.fell} zubehoer={zustand.angelegt} gross />
        <span>{zustand.name}</span>
      </div>
      <div className="zimmer-schrank-faecher">
        <h3 className="zimmer-abschnitt">Fell</h3>
        <div className="zimmer-karten zimmer-karten-klein">
          {/* Standardfell: kein Fell angelegt */}
          <button className={`zimmer-karte zimmer-karte-klein zimmer-wahl ${zustand.angelegt.fell ? '' : 'an'}`}
                  aria-pressed={!zustand.angelegt.fell}
                  onClick={() => { if (zustand.angelegt.fell) zustand.umschalten(zustand.angelegt.fell); }}>
            <Vorschau fell={0} zubehoer={{}} />
            <h3>Standard</h3>
          </button>
          {felle.map((f) => (
            <button key={f.id} className={`zimmer-karte zimmer-karte-klein zimmer-wahl ${fellAn(f.id) ? 'an' : ''}`}
                    aria-pressed={fellAn(f.id)} onClick={() => zustand.umschalten(f.id)} data-artikel={f.id}>
              <Vorschau fell={f.variante} zubehoer={{}} />
              <h3>{f.name}</h3>
            </button>
          ))}
        </div>
        <h3 className="zimmer-abschnitt">Zubehör</h3>
        {teile.length === 0 ? (
          <p className="zimmer-hinweis">Noch nichts im Schrank – im Laden gibt es Halsband, Brille, Hut und mehr.</p>
        ) : (
          <div className="zimmer-karten zimmer-karten-klein">
            {teile.map((z) => (
              <button key={z.id} className={`zimmer-karte zimmer-karte-klein zimmer-wahl ${fellAn(z.id) ? 'an' : ''}`}
                      aria-pressed={fellAn(z.id)} onClick={() => zustand.umschalten(z.id)} data-artikel={z.id}>
                <Vorschau fell={zustand.fell} zubehoer={{ [z.id]: true }} />
                <h3>{z.name}</h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
