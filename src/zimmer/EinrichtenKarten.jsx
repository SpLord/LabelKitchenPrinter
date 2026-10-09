import { AUSSTATTUNG } from '../cat/laden.js';
import { Aquarium, Ball, Futterautomat, KartonHinten, KartonVorne, Katzengras, Teppich, Katzenklo, Kratzbaum, Kuschelhoehle, Napf, Trinkbrunnen, Wandregal } from './Moebel.jsx';

const K = { stroke: '#2f2a26', strokeLinejoin: 'round', strokeLinecap: 'round' };

/*
  Vorschau je Möbel: dieselbe Zeichnung wie im Zimmer, nur kleiner – man sieht
  vor dem Kauf genau, was hinterher dasteht. viewBox je Möbel passend zu
  seinen Massen in Moebel.jsx (Anker = Mitte der Standfläche bei 0/0).
*/
const VORSCHAU = {
  karton:        { box: '-74 -96 148 104', bild: <><KartonHinten x={0} y={0} /><KartonVorne x={0} y={0} /></> },
  teppich:       { box: '-136 -40 272 76', bild: <Teppich x={0} y={0} /> },
  aquarium:      { box: '-66 -156 132 166', bild: <Aquarium x={0} y={0} /> },
  ball:          { box: '-30 -42 60 50', bild: <Ball x={0} y={0} /> },
  katzengras:    { box: '-44 -96 88 104', bild: <Katzengras x={0} y={0} /> },
  wandregal:     { box: '-112 -40 196 264', bild: <><rect x="-75" y="-7" width="150" height="14" rx="5" fill="#a16207" stroke="#2f2a26" strokeWidth="5" /><Wandregal x={0} y={0} /></> },
  katzenklo:     { box: '-74 -70 148 82', bild: <Katzenklo x={0} y={0} fuellung={0} /> },
  trinkbrunnen:  { box: '-60 -90 120 100', bild: <Trinkbrunnen x={0} y={0} /> },
  futterautomat: { box: '-60 -150 120 160', bild: <><Futterautomat x={0} y={0} /><Napf x={0} y={0} fuellung={60} /></> },
  kratzbaum:     { box: '-80 -320 160 330', bild: <Kratzbaum x={0} y={0} /> },
  kuschelhoehle: { box: '-96 -118 192 128', bild: <Kuschelhoehle x={0} y={0} /> },
  glueckspfote:  {
    box: '0 0 80 70',
    bild: (
      <g {...K} strokeWidth="3.5" fill="#86efac">
        <ellipse cx="40" cy="46" rx="16" ry="13" />
        <circle cx="22" cy="28" r="7" /><circle cx="34" cy="18" r="7" /><circle cx="48" cy="18" r="7" /><circle cx="60" cy="28" r="7" />
      </g>
    ),
  },
};

/* Billigstes zuerst: das Klo ist der Einstieg (Design: Möbel günstig). */
const REIHE = [...AUSSTATTUNG].sort((a, b) => a.preis - b.preis);

/*
  Einrichten: Möbel kaufen – sie stehen danach auf ihrem Platz im Zimmer
  und die Katze benutzt sie selbst. Umstellen kommt mit Etappe 4.
*/
export default function EinrichtenKarten({ zustand, onGekauft }) {
  return (
    <div className="zimmer-karten">
      {REIHE.map((a) => {
        const v = VORSCHAU[a.id];
        const hat = zustand.besitz.includes(a.id);
        const zuTeuer = zustand.muenzen < a.preis;
        return (
          <article key={a.id} className={`zimmer-karte ${hat ? 'zimmer-karte-hat' : ''}`} data-artikel={a.id}>
            <svg viewBox={v?.box ?? '0 0 80 70'} className="zimmer-karte-bild" aria-hidden="true"
                 preserveAspectRatio="xMidYMax meet">
              {v?.bild}
            </svg>
            <h3>{a.name}</h3>
            <p>{a.wirkung}</p>
            {hat ? (
              <span className="zimmer-hat">steht im Zimmer</span>
            ) : (
              <button className="zimmer-preis" disabled={zuTeuer}
                      onClick={() => { if (zustand.kaufen(a.id)) onGekauft(a); }}>
                <span className="zimmer-muenze" aria-hidden="true" /> {a.preis}
              </button>
            )}
            {!hat && zuTeuer && <small>Zu wenig Münzen</small>}
          </article>
        );
      })}
    </div>
  );
}
