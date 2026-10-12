import { LECKERLI } from './brett.js';

/*
  Freies Spiel (seit 2.12.0 "Leckerli-Drei"): ein leeres Brett, 20 Züge,
  Münzen nach Punkten – mit der Fünf-Minuten-Pause aller Münzspiele.
  Seit 2.13.0 auf dem Brett der Leckerli-Reise, also mit Spezial-Leckerli.
*/
export const FREI = { zuege: 20, arten: LECKERLI.slice(0, 5), lohnJe: 80, lohnMax: 20 };
export const freiLohn = (punkte) => Math.min(FREI.lohnMax, Math.floor(Math.max(0, punkte) / FREI.lohnJe));
