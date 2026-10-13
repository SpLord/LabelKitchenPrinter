import Feld from './Feld.jsx';
import './reise.css';
import { spalte, zeile } from './brett.js';

/* Versatz beim Ziehen: das gezogene Feld folgt dem Finger, der Nachbar weicht entgegen. */
const versatz = (ziehen, i) => {
  if (!ziehen) return null;
  if (ziehen.i === i) return { '--zx': `${ziehen.dx}px`, '--zy': `${ziehen.dy}px` };
  if (ziehen.nach === i) return { '--zx': `${-ziehen.dx}px`, '--zy': `${-ziehen.dy}px` };
  return null;
};

/*
  Das Brett: unten die Pfützen (fest an ihrer Zelle), darüber die Felder
  (per transform an ihrem Platz, key = id – so rutschen sie sichtbar),
  obendrauf die Wirkungen der Spezial-Leckerli (Strahl, Druckwelle) und
  die fliegenden Punkte.
*/
export default function BrettAnsicht({ spiel }) {
  const {
    s, gewaehlt, weg, wackelt, effekte, pops, meldung, beschaeftigt, ziehen, tipp, pfoteAn,
    tippen, runter, bewegen, hoch, abbrechen,
  } = spiel;
  return (
    <div className={`dreier-brett ${pfoteAn ? 'pfote-an' : ''}`} style={{ '--n': s.n }} data-dreier-beschaeftigt={beschaeftigt ? '1' : '0'}>
      {s.pfuetzen.map((p, i) => (p > 0
        ? <span key={`p${i}`} className={`dreier-pfuetze stufe-${p}`} style={{ '--z': zeile(s, i), '--s': spalte(s, i) }} data-pfuetze={p} />
        : null))}
      {s.felder.map((f, i) => {
        const v = versatz(ziehen, i);
        return (
          <button
            key={f.id} type="button"
            className={[
              'dreier-feld', `art-${f.art}`, f.spezial ? `spezial-${f.spezial}` : '',
              gewaehlt === i ? 'gewaehlt' : '', weg.includes(f.id) ? 'platzt' : '', wackelt.includes(i) ? 'wackelt' : '',
              v ? 'zieht' : '', tipp?.includes(i) ? 'hinweis' : '',
            ].join(' ')}
            style={{ '--z': zeile(s, i), '--s': spalte(s, i), ...v }}
            onPointerDown={(e) => runter(i, e)} onPointerMove={(e) => bewegen(i, e)}
            onPointerUp={(e) => hoch(i, e)} onPointerCancel={abbrechen}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tippen(i); } }}
            aria-label={`${f.spezial ? `${f.art} (${f.spezial})` : f.art}, Zeile ${zeile(s, i) + 1}, Spalte ${spalte(s, i) + 1}`}
            data-feld={i} data-art={f.art} data-spezial={f.spezial ?? undefined}
          >
            <span className={`dreier-bild ${f.neu ? 'neu' : ''} ${f.frisch ? 'frisch' : ''}`}>
              <svg viewBox="-20 -20 40 40" aria-hidden="true"><Feld feld={f} /></svg>
            </span>
          </button>
        );
      })}
      {effekte.map((e) => (
        <span key={e.key} className={`dreier-effekt effekt-${e.art} ${e.gross ? 'gross' : ''}`} style={{ '--z': e.z, '--s': e.sp }} aria-hidden="true" />
      ))}
      {pops.map((p) => (
        <span key={p.key} className="dreier-pop" style={{ '--z': p.z, '--s': p.sp }} aria-hidden="true">+{p.punkte}</span>
      ))}
      {meldung && <span key={meldung} className="dreier-meldung" role="status">{meldung}</span>}
    </div>
  );
}

/* Knopf für die Pfote (einmal je Spiel ein Feld wegklopfen). */
export function PfotenKnopf({ spiel }) {
  const { pfotenUebrig, pfoteAn, setPfoteAn, beschaeftigt } = spiel;
  return (
    <button type="button" className={`zimmer-knopf dreier-pfote ${pfoteAn ? 'an' : ''}`} disabled={pfotenUebrig <= 0 || beschaeftigt}
            onClick={() => setPfoteAn(!pfoteAn)} aria-pressed={pfoteAn}
            title="Pfote: ein Leckerli oder eine Kiste wegklopfen – kostet keinen Zug" data-pfote={pfotenUebrig}>
      <svg viewBox="-20 -20 40 40" aria-hidden="true">
        <g fill="#fbcfe8" stroke="#2f2a26" strokeWidth="2.6">
          <ellipse cx="0" cy="6" rx="9" ry="7.5" /><circle cx="-10" cy="-5" r="4" /><circle cx="-3.5" cy="-11" r="4" />
          <circle cx="3.5" cy="-11" r="4" /><circle cx="10" cy="-5" r="4" />
        </g>
      </svg>
      {pfoteAn ? 'Feld antippen' : `Pfote ×${pfotenUebrig}`}
    </button>
  );
}
