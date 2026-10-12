import Feld from './Feld.jsx';
import './reise.css';
import { spalte, zeile } from './brett.js';

/*
  Das Brett: unten die Pfützen (fest an ihrer Zelle), darüber die Felder
  (per transform an ihrem Platz, key = id – so rutschen sie sichtbar),
  obendrauf die Wirkungen der Spezial-Leckerli (Strahl, Druckwelle).
*/
export default function BrettAnsicht({ spiel }) {
  const { s, gewaehlt, weg, wackelt, effekte, meldung, beschaeftigt, tippen, runter, hoch } = spiel;
  return (
    <div className="dreier-brett" style={{ '--n': s.n }} data-dreier-beschaeftigt={beschaeftigt ? '1' : '0'}>
      {s.pfuetzen.map((p, i) => (p > 0
        ? <span key={`p${i}`} className={`dreier-pfuetze stufe-${p}`} style={{ '--z': zeile(s, i), '--s': spalte(s, i) }} data-pfuetze={p} />
        : null))}
      {s.felder.map((f, i) => (
        <button
          key={f.id} type="button"
          className={[
            'dreier-feld', `art-${f.art}`, f.spezial ? `spezial-${f.spezial}` : '',
            gewaehlt === i ? 'gewaehlt' : '', weg.includes(f.id) ? 'platzt' : '', wackelt.includes(i) ? 'wackelt' : '',
          ].join(' ')}
          style={{ '--z': zeile(s, i), '--s': spalte(s, i) }}
          onPointerDown={(e) => runter(i, e)} onPointerUp={(e) => hoch(i, e)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tippen(i); } }}
          aria-label={`${f.spezial ? `${f.art} (${f.spezial})` : f.art}, Zeile ${zeile(s, i) + 1}, Spalte ${spalte(s, i) + 1}`}
          data-feld={i} data-art={f.art} data-spezial={f.spezial ?? undefined}
        >
          <span className={`dreier-bild ${f.neu ? 'neu' : ''} ${f.frisch ? 'frisch' : ''}`}>
            <svg viewBox="-20 -20 40 40" aria-hidden="true"><Feld feld={f} /></svg>
          </span>
        </button>
      ))}
      {effekte.map((e) => (
        <span key={e.key} className={`dreier-effekt effekt-${e.art}`} style={{ '--z': e.z, '--s': e.sp }} aria-hidden="true" />
      ))}
      {meldung && <span className="dreier-meldung" role="status">{meldung}</span>}
    </div>
  );
}
