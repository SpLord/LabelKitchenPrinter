/*
  Was liegt unter der Katze?

  Anlass: Die Katze (.cat-sprite, pointer-events: auto) verschluckte Tipps.
  Stand sie auf einem Etikettenknopf, streichelte der Tipp sie, und das Etikett
  wurde nicht gedruckt – in der Küche heißt das: ein Etikett fehlt.

  Die Entscheidung ist reine Logik über den Stapel der Elemente unter dem
  Finger (document.elementsFromPoint, oberstes zuerst) und deshalb ohne
  Browser testbar. Das eigentliche Weiterreichen des Tipps macht CatSprite.
*/

const KATZE = '.cat-sprite';
const BEDIENELEMENT = 'button, a, input, select, textarea, label, [role=button]';
const KALENDER = '.react-datepicker';
const FELDER = ['INPUT', 'TEXTAREA', 'SELECT'];

/*
  Liefert das Bedienelement, an das der Tipp gehen soll, oder null, wenn die
  Katze ihn behalten und streicheln darf.

  Es zählt nur das OBERSTE Element außerhalb der Katze: Das ist, was der
  Mensch sieht und gemeint hat. Läge darüber ein Deckel ohne Funktion,
  wäre das Weiterreichen an einen Knopf dahinter ein Geisterklick.
*/
export function tippziel(stapel) {
  if (!Array.isArray(stapel)) return null;
  const oben = stapel.find((e) => e && !e.closest(KATZE));
  if (!oben) return null;
  // Im Kalender sind die Tage keine Knöpfe, aber sehr wohl bedienbar.
  return oben.closest(BEDIENELEMENT) ?? (oben.closest(KALENDER) ? oben : null);
}

/* Eingabefelder brauchen Fokus (Tastatur), alles andere einen Klick. */
export function istEingabefeld(element) {
  return !!element && FELDER.includes(element.tagName);
}
