import CatVariant from '../cat/CatVariant.jsx';
import './zimmer-karte.css';


/* Was ihr gerade fehlt, in Worten – Reihenfolge = Dringlichkeit. */
export const zustandsText = ({ krank, bedarf, zustand }) => {
  if (krank || bedarf.includes('krank')) return 'ist krank';
  if (bedarf.includes('durst')) return 'hat Durst';
  if (bedarf.includes('hunger')) return 'hat Hunger';
  if (bedarf.includes('langeweile')) return 'langweilt sich';
  if (bedarf.includes('dreck')) return 'braucht ein sauberes Zimmer';
  return zustand?.label ?? 'zufrieden';
};

/*
  Küchenansicht: statt der vollen Statusleiste nur diese eine Karte.
  Katze, Name, was ihr fehlt, Münzen – ein Tipp öffnet das Zimmer. Nichts von
  der Katze liegt mehr über den Etikettenknöpfen.
*/
export default function KuechenKarte({ zustand, onOeffnen }) {
  const text = zustandsText(zustand);
  const braucht = zustand.krank || zustand.bedarf.length > 0;
  return (
    <button className="kuechen-karte" onClick={onOeffnen} aria-label={`${zustand.name} ${text} – Katzenzimmer öffnen`}>
      <span className="kuechen-karte-katze" aria-hidden="true">
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <CatVariant index={zustand.fell} active={false} zubehoer={zustand.angelegt} />
        </svg>
        {braucht && <span className="kuechen-karte-punkt" />}
      </span>
      <span className="kuechen-karte-text">
        <strong>{zustand.name}</strong>
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
