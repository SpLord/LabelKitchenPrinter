import { useRef, useState } from 'react';

/*
  Textfeld für Gruppen- und Etikettennamen.

  Vorher ging jeder Tastendruck direkt in den Bestand, und der Bestand trimmt
  Namen. Folge: ein getipptes Leerzeichen am Ende verschwand sofort, aus
  "Rote Beete" wurde "RoteBeete". Ein Feld liess sich auch nicht leeren, weil
  der leere Zwischenstand verworfen wurde – und jeder Tastendruck löste einen
  eigenen Speichervorgang samt PUT an den Server aus.

  Jetzt tippt man in einen eigenen Entwurf. Übernommen wird beim Verlassen
  des Feldes oder mit Enter, Escape verwirft. Bleibt das Feld leer, gilt
  wieder der alte Name – es geht nichts verloren.

  - props:
    - value: string              aktueller Name im Bestand
    - onCommit(name): void       nur mit einem nicht-leeren, getrimmten Namen
    - übrige Props gehen ans <input> (className, aria-label …)
*/
export default function NamensFeld({ value, onCommit, ...rest }) {
  // null heisst: gerade nicht in Bearbeitung, das Feld zeigt den Bestand
  const [entwurf, setEntwurf] = useState(null);
  /*
    Escape und Enter beenden die Bearbeitung beide über blur(), damit genau
    eine Stelle übernimmt. Ein State-Flag ginge nicht: onBlur liefe noch mit
    dem alten Wert aus diesem Render und übernähme den verworfenen Text.
  */
  const verwerfenRef = useRef(false);

  const beenden = () => {
    const verwerfen = verwerfenRef.current;
    verwerfenRef.current = false;
    if (entwurf !== null && !verwerfen) {
      const name = entwurf.trim();
      if (name && name !== value) onCommit(name);
    }
    setEntwurf(null);
  };

  return (
    <input
      {...rest}
      value={entwurf ?? value}
      onFocus={() => setEntwurf(value)}
      onChange={(e) => setEntwurf(e.target.value)}
      onBlur={beenden}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== 'Escape') return;
        e.preventDefault();
        verwerfenRef.current = e.key === 'Escape';
        e.currentTarget.blur();
      }}
    />
  );
}
