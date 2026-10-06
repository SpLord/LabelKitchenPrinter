/*
  Name der Katze. Bis 1.9.0 hiess sie "Mails" – so heisst aber der Koch.
  Jetzt hat sie einen eigenen Namen, den man im Zimmer per Tipp ändert.
*/
export const STANDARD_NAME = 'Mieze';
export const MAX_LAENGE = 16;

/* Getrimmt, Zeilenumbrüche raus, gekürzt – leer oder kein Text → null. */
export function putzeName(roh) {
  if (typeof roh !== 'string') return null;
  const name = roh.replace(/\s+/g, ' ').trim().slice(0, MAX_LAENGE).trim();
  return name || null;
}
