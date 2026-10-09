import './zimmer-karte.css';


/* Was ihr gerade fehlt, in Worten – Reihenfolge = Dringlichkeit. */
export const zustandsText = ({ krank, bedarf, zustand, geschenkHeute: geschenk = false, wasser = 100, moebel }) => {
  if (krank || bedarf.includes('krank')) return 'ist krank';
  // Leere Schale zuerst nennen: das ist das, was zu tun ist
  if (wasser <= 0 && !moebel?.has('trinkbrunnen')) return 'Wasser leer';
  if (bedarf.includes('durst')) return 'hat Durst';
  if (bedarf.includes('hunger')) return 'hat Hunger';
  if (bedarf.includes('langeweile')) return 'langweilt sich';
  // Kurz halten: eine breitere Karte nimmt der Küchenkatze den Platz weg
  if (bedarf.includes('dreck')) return 'braucht Putzen';
  if (geschenk) return 'Geschenk wartet';
  return zustand?.label ?? 'zufrieden';
};

/*
  Küchenansicht: statt der vollen Statusleiste nur diese eine Karte.
  Katze, Name, was ihr fehlt, Münzen – ein Tipp öffnet das Zimmer. Nichts von
  der Katze liegt mehr über den Etikettenknöpfen.
*/
export default function KuechenKarte({ zustand, onOeffnen }) {
  const text = zustandsText(zustand);
  const braucht = zustand.krank || zustand.bedarf.length > 0 || zustand.geschenkHeute
    || (zustand.wasser <= 0 && !zustand.moebel.has('trinkbrunnen'));
  return (
    <button className="kuechen-karte" onClick={onOeffnen} aria-label={`${zustand.name} ${text} – Katzenzimmer öffnen`}>
      {/* Kein Katzenbild mehr in der Karte: die Katze selbst läuft daneben
          (KuechenKatze), und ein Bild hier nahm ihr 64 px Platz weg */}
      <span className="kuechen-karte-text">
        <strong>{zustand.name}{braucht && <span className="kuechen-karte-punkt" aria-hidden="true" />}</strong>
        <span>{text}</span>
      </span>
      <span className="kuechen-karte-muenzen">
        <span className="zimmer-muenze" aria-hidden="true" />
        {zustand.muenzen}
      </span>
      {/* Damit niemand rätseln muss, dass das ein Knopf ist */}
      <span className="kuechen-karte-los">Zimmer ›</span>
    </button>
  );
}
