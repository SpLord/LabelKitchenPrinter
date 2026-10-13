/*
  Was es im Bereich "Füttern" gibt (seit 2.14.0 fünf Sorten).

  menge: so viel kommt in den Napf; laune/durst: wirkt sofort, wenn man es
  hinstellt (die Katze freut sich über Besonderes, Milch löscht auch Durst).
  Teureres bringt je Münze etwas mehr – sonst kauft niemand das Festmahl.
*/
export const FUTTER = [
  { id: 'trocken', name: 'Trockenfutter', menge: 20, preis: 3, farbe: '#fde68a', text: '+20 in den Napf' },
  { id: 'nass', name: 'Nassfutter', menge: 35, preis: 5, farbe: '#c7d2fe', text: '+35 in den Napf' },
  // 2.14.0
  { id: 'milch', name: 'Katzenmilch', menge: 10, preis: 4, durst: 30, laune: 3, farbe: '#f8fafc', text: '+10 Napf, löscht Durst' },
  { id: 'thunfisch', name: 'Thunfisch', menge: 50, preis: 7, laune: 6, farbe: '#bae6fd', text: '+50 Napf, ihr Lieblingsfisch' },
  { id: 'festmahl', name: 'Lachs-Festmahl', menge: 100, preis: 14, laune: 15, farbe: '#fecaca', text: 'Napf randvoll, sie ist selig' },
];

/* Wie viel wirklich in den Napf passt – für die Anzeige "Napf ist voll". */
export const passtRein = (napf, f) => Math.max(0, Math.min(f.menge, 100 - napf));
