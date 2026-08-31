/*
  Auslieferungszustand der Etiketten-Gruppen.
  Dient als Startwert und als Ziel für „Zurücksetzen" im Editor.
  Reihenfolge ist bewusst ein Array – Objekt-Schlüssel garantieren keine Sortierung.
*/
export const DEFAULT_GROUPS = [
  {
    id: 'fleisch',
    name: 'Fleisch',
    icon: '🥩',
    entries: ['Steak', 'Filet', 'Steak Streifen', 'Filet Streifen', 'Kalbschnitzel', 'Schweineschnitzel'],
  },
  { id: 'saucen', name: 'Saucen', icon: '🧂', entries: ['Portweinsauce', 'Trüffelmajo', 'Cocktailsauce', 'Scharfe Majo'] },
  { id: 'fond', name: 'Fond', icon: '🍲', entries: ['Fleischfond', 'Gemüsefond'] },
  { id: 'dressing', name: 'Dressing', icon: '🥗', entries: ['Himbeerdressing', 'Balsamicodressing'] },
  { id: 'salat', name: 'Salat', icon: '🥬', entries: ['Fregola', 'Rote Beete', 'Fregola Gemüse'] },
  { id: 'menue', name: 'Menü', icon: '🍽️', entries: ['Lachs', 'Schmorjuis', 'USBeef', 'Parmesanschaum', 'Sherryschaum'] },
];

export const FALLBACK_ICON = '🏷️';
