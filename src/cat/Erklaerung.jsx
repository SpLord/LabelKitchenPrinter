import { AUSSTATTUNG } from './laden.js';
import { CONDITIONS, DECAY_PER_HOUR, NEED_MAX } from './needs.js';
import {
  FREUDE_AUFRAEUMEN, FREUDE_FANGEN, FREUDE_LECKERLI, FREUDE_STREICHELN,
  FREUDE_VERFALL_PRO_STUNDE, KRANK_NACH_STUNDEN, KRANK_SCHWELLE,
  MEDIZIN_PREIS, SCHLAF_BIS, SCHLAF_VON, STUFEN,
} from './tamagotchi.js';
import {
  FREUNDSCHAFT_FUETTERN, FREUNDSCHAFT_MAX, FREUNDSCHAFT_SPIELEN,
  FREUNDSCHAFT_STREICHELN, FREUNDSCHAFT_TAG,
  PHASEN, bisNaechstePhase,
} from './wachstum.js';

/*
  Erklärung der Statusleiste.

  Anlass: „bei den Herzen hab ich im Moment gar keine Ahnung." Die Leiste
  zeigt Zahlen, aber nirgends stand, woher sie kommen und was sie bewirken.

  Alle Werte werden aus den Regel-Dateien IMPORTIERT, nicht abgeschrieben.
  Eine Hilfe, die eigene Zahlen führt, behauptet nach der ersten Änderung
  etwas anderes als das Spiel tut – und ist dann schlimmer als keine.
*/
export default function Erklaerung({
  hunger, thirst, freude, zustand, schlaeftGerade, krank, wachstum, besitz = [], onClose,
}) {
  const stundenLeer = Math.round(NEED_MAX / DECAY_PER_HOUR);
  const naechste = bisNaechstePhase(wachstum.tage);
  const proHerz = FREUNDSCHAFT_MAX / 5;
  const aktiveAusstattung = AUSSTATTUNG.filter((a) => besitz.includes(a.id));

  return (
    <div className="gimmick-panel top erklaerung" onClick={(e) => e.stopPropagation()}>
      <div className="gimmick-title">❓ Was bedeutet was?</div>

      <section className="erk-block">
        <h4>{zustand.emoji} Zustand: {zustand.label}</h4>
        <p>
          Der Zustand entscheidet, wie viele Münzen ein Fund einbringt. Er ergibt sich
          aus dem <strong>niedrigeren</strong> der beiden Werte Hunger und Durst –
          das schwächste Glied zählt.
        </p>
        <ul className="erk-liste">
          {STUFEN.map((s) => (
            <li key={s.key} className={s.key === zustand.key ? 'jetzt' : ''}>
              <span>{s.emoji} {s.label}</span>
              <span className="erk-wert">
                {s.faktor === 0 ? 'keine Münzen' : `${s.faktor}× Münzen`}
              </span>
            </li>
          ))}
        </ul>
        <p className="erk-fein">
          Ab {CONDITIONS[0].min}&nbsp;% ist sie munter, ab {CONDITIONS[1].min}&nbsp;%
          zufrieden, ab {CONDITIONS[2].min}&nbsp;% träge, darunter schwach.
          Glücklich wird sie nur, wenn sie munter <em>und</em> die Zufriedenheit
          über 80&nbsp;% ist. Zwischen {SCHLAF_VON} und {SCHLAF_BIS} Uhr schläft
          sie – dann sammelt sie nichts, aber alles verfällt auch nur halb so schnell.
          {schlaeftGerade && ' Gerade schläft sie.'}
        </p>
      </section>

      <section className="erk-block">
        <h4>🍽️ Hunger {Math.round(hunger)}&nbsp;% · 💧 Durst {Math.round(thirst)}&nbsp;%</h4>
        <p>
          Beide fallen um {DECAY_PER_HOUR}&nbsp;% je Stunde – von voll auf leer sind das
          rund {stundenLeer} Stunden, also gut eine Schicht. Auffüllen über
          <em> Füttern &amp; Wasser</em> im ✨-Menü: den Napf hinstellen, die Katze geht hin.
        </p>
        <p className="erk-fein">
          Bleibt einer der beiden länger als {KRANK_NACH_STUNDEN} Stunden unter
          {' '}{KRANK_SCHWELLE}&nbsp;%, wird sie krank {krank && '– so wie jetzt '}
          und sammelt gar nichts mehr. Medizin im ✨-Menü kostet {MEDIZIN_PREIS} 🪙
          und hilft sofort. Zufall ist nicht im Spiel: krank wird sie nur durch
          Vernachlässigung.
        </p>
      </section>

      <section className="erk-block">
        <h4>💛 Zufriedenheit {Math.round(freude)}&nbsp;%</h4>
        <p>
          Fällt langsamer als Hunger, nämlich {FREUDE_VERFALL_PRO_STUNDE}&nbsp;% je
          Stunde – schneller, wenn sie hungert oder Häufchen herumliegen.
          Über 80&nbsp;% macht sie glücklich und damit doppelt einträglich.
        </p>
        <ul className="erk-liste">
          <li><span>Spielzeug gefangen</span><span className="erk-wert">+{FREUDE_FANGEN}</span></li>
          <li><span>Leckerlis geworfen</span><span className="erk-wert">+{FREUDE_LECKERLI}</span></li>
          <li><span>Häufchen weggeklickt</span><span className="erk-wert">+{FREUDE_AUFRAEUMEN}</span></li>
          <li><span>Gestreichelt</span><span className="erk-wert">+{FREUDE_STREICHELN}</span></li>
        </ul>
        <p className="erk-fein">
          Spielzeug entsteht durch einen Klick auf eine freie Stelle – nicht auf
          Knöpfe oder die Katze selbst. Dann läuft sie hin und fängt es.
        </p>
      </section>

      <section className="erk-block">
        <h4>❤️ Herzen und Lebensphase</h4>
        <p>
          Das sind <strong>zwei verschiedene Dinge</strong> nebeneinander.
        </p>
        <p>
          Die <strong>Herzen</strong> sind die Freundschaft: {wachstum.freundschaft} von
          {' '}{FREUNDSCHAFT_MAX} Punkten, ein Herz je {proHerz} Punkte. Sie
          <strong> fällt nie</strong> – auch nicht, wenn die Katze eine Woche allein
          bleibt. Es geht dann nur langsamer voran.
        </p>
        <ul className="erk-liste">
          <li><span>Gefüttert</span><span className="erk-wert">+{FREUNDSCHAFT_FUETTERN}</span></li>
          <li><span>Gestreichelt</span><span className="erk-wert">+{FREUNDSCHAFT_STREICHELN}</span></li>
          <li><span>Mit ihr gespielt</span><span className="erk-wert">+{FREUNDSCHAFT_SPIELEN}</span></li>
          <li><span>Ein gut gepflegter Tag</span><span className="erk-wert">+{FREUNDSCHAFT_TAG}</span></li>
        </ul>
        <p>
          Die <strong>Phase</strong> daneben ist das Alter: {wachstum.tage} gepflegte
          Tage. Ein Tag zählt, wenn die Katze an dem Tag weder schwach noch krank
          war – höchstens einmal je Kalendertag.
        </p>
        <ul className="erk-liste">
          {PHASEN.map((p) => (
            <li key={p.key} className={p.key === wachstum.phase.key ? 'jetzt' : ''}>
              <span>{p.name}</span>
              <span className="erk-wert">ab {p.ab} Tagen</span>
            </li>
          ))}
        </ul>
        {naechste && (
          <p className="erk-fein">
            Noch {naechste.fehlt} {naechste.fehlt === 1 ? 'gepflegter Tag' : 'gepflegte Tage'}
            {' '}bis {naechste.phase.name}.
          </p>
        )}
      </section>

      <section className="erk-block">
        <h4>🪙 Münzen</h4>
        <p>
          Münzen kommen aus dem <strong>Anklicken</strong> von Häufchen und Leckerlis –
          nicht daraus, dass die Katze etwas fängt. Was ein Fund wert ist, bestimmt
          der Zustand oben. Ausgegeben werden sie für Futter, Medizin, den Einsatz
          im Hütchenspiel und den Katzenladen.
        </p>
      </section>

      <section className="erk-block">
        <h4>🛍️ Ausstattung</h4>
        {aktiveAusstattung.length === 0 ? (
          <p className="erk-fein">
            Im Katzenladen gibt es neben Fell und Zubehör auch Ausstattung, die
            wirklich etwas ändert – etwa den Verfall bremst. Bisher ist nichts davon
            gekauft.
          </p>
        ) : (
          <ul className="erk-liste">
            {aktiveAusstattung.map((a) => (
              <li key={a.id} className="jetzt">
                <span>{a.emoji} {a.name}</span>
                <span className="erk-wert">{a.wirkung}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button onClick={onClose}>Schließen</button>
      </div>
    </div>
  );
}
