import { schichtSchluessel } from '../print/schicht.js';

/*
  Herzen schalten Verhalten frei (Design 2026-10-06, Etappe 6) – statt der
  alten Münz-Freischaltschwellen ein einziges Fortschrittssystem: Je enger
  die Freundschaft, desto mehr zeigt die Katze.

  Damit Herzen etwas wert sind, wächst die Freundschaft je Tag nur begrenzt:
  Dauerstreicheln füllt sonst alle Herzen in Minuten.
*/
export const FREISCHALTUNGEN = [
  { herz: 1, id: 'begruessen', titel: 'Begrüssung', text: 'Sie kommt angelaufen, wenn du das Zimmer öffnest.' },
  { herz: 2, id: 'rollen', titel: 'Bauch zeigen', text: 'Beim Streicheln rollt sie sich auf den Rücken.' },
  { herz: 3, id: 'zweitesGeschenk', titel: 'Zweites Geschenk', text: 'Ab Mittag liegt ein zweites Geschenk im Zimmer.' },
  { herz: 4, id: 'sonnenbad', titel: 'Sonnenbad', text: 'Am Fenster tankt sie Sonne – das bringt dreimal so viel Laune.' },
  { herz: 5, id: 'fundstuecke', titel: 'Fundstücke', text: 'Ab und zu bringt sie dir etwas Seltenes mit.' },
];

export const freigeschaltet = (herzen, id) => {
  const f = FREISCHALTUNGEN.find((x) => x.id === id);
  return Boolean(f) && herzen >= f.herz;
};

/* Was seit dem letzten Besuch dazukam – für die Feier beim neuen Herz. */
export const neuFreigeschaltet = (gesehen, jetzt) =>
  FREISCHALTUNGEN.filter((f) => f.herz > gesehen && f.herz <= jetzt);

/* Freundschaftspunkte je Quelle und Schichttag. */
export const TAGESGRENZE = { streicheln: 3, spielen: 2, fuettern: 2 };

const leer = (tag) => ({ tag, streicheln: 0, spielen: 0, fuettern: 0 });

export function freundschaftHeute(stand, quelle, plus, jetzt = new Date()) {
  const tag = schichtSchluessel(jetzt);
  const heute = stand?.tag === tag ? stand : leer(tag);
  const grenze = TAGESGRENZE[quelle];
  if (!grenze || !(plus > 0)) return { stand: heute, plus: 0 };
  const erlaubt = Math.max(0, Math.min(plus, grenze - heute[quelle]));
  return { stand: { ...heute, [quelle]: heute[quelle] + erlaubt }, plus: erlaubt };
}

export function grenzeLesen(roh) {
  let d;
  try { d = JSON.parse(roh); } catch { return null; }
  if (!d || typeof d.tag !== 'string') return null;
  const zahl = (n) => (Number.isFinite(n) && n > 0 ? n : 0);
  return { tag: d.tag, streicheln: zahl(d.streicheln), spielen: zahl(d.spielen), fuettern: zahl(d.fuettern) };
}
