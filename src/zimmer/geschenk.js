import { schichtSchluessel } from '../print/schicht.js';

/*
  Tägliches Geschenk und Selbstheilung (Design 2026-10-06, Etappe 3).

  Geschenk: einmal je Schichttag (ab 5 Uhr, wie das Etikettendatum) legt
  die Katze ein Päckchen ins Zimmer. Darin 10 Münzen, dazu bis 20 für die
  Pflege am Vortag und 4 je Herz. Die Glückspfote legt ein Viertel drauf.
  So lohnt sich das Kümmern – und wer einen Tag fehlt, verliert nichts als
  den Pflegebonus.

  Selbstheilung: Keine Sackgasse. Bleibt eine kranke Katze zwölf Stunden
  gut versorgt, wird sie von selbst gesund; Medizin geht nur schneller.

  Reine Funktionen, die Zeit wird hineingereicht.
*/

export const GESCHENK = { grund: 10, pflegeMax: 20, jeHerz: 4, glueckspfote: 1.25 };

/* Pflegepunkte je Tätigkeit – gedeckelt bei pflegeMax pro Tag. */
export const PFLEGE = { fuettern: 4, putzen: 3, streicheln: 1, spielen: 4 };

export const betrag = ({ pflegeVortag = 0, herzen = 0, glueckspfote = false }) => {
  const roh = GESCHENK.grund + Math.min(GESCHENK.pflegeMax, Math.max(0, pflegeVortag)) + GESCHENK.jeHerz * herzen;
  return glueckspfote ? Math.round(roh * GESCHENK.glueckspfote) : roh;
};

/*
  abgeholt: "JJJJ-MM-TT|anzahl" – oder alt nur der Tag (= eins abgeholt).
  Mit dem dritten Herz kommt ab Mittag ein zweites Päckchen.
*/
export const MITTAG = 12;
const lesenAbgeholt = (abgeholt) => {
  if (typeof abgeholt !== 'string' || !abgeholt) return { tag: null, anzahl: 0 };
  const [tag, n] = abgeholt.split('|');
  const anzahl = Number(n);
  return { tag, anzahl: Number.isFinite(anzahl) && anzahl > 0 ? anzahl : 1 };
};

export const geschenkDa = (abgeholt, jetzt = new Date(), zweites = false) => {
  const { tag, anzahl } = lesenAbgeholt(abgeholt);
  if (tag !== schichtSchluessel(jetzt)) return true;
  return zweites && anzahl < 2 && jetzt.getHours() >= MITTAG;
};

/* Schlüssel des Schichttags davor. */
const vortagSchluessel = (jetzt) => schichtSchluessel(new Date(jetzt.getTime() - 24 * 3_600_000));

/* Pflegepunkte des Vortags – egal ob heute schon gepflegt wurde. */
const pflegeVom = (pflege, tag) => {
  if (!pflege) return 0;
  if (pflege.tag === tag) return pflege.punkte;
  if (pflege.vortag?.tag === tag) return pflege.vortag.punkte;
  return 0;
};

/* Geschenk öffnen. muenzen 0 heisst: heute schon geholt. */
export function abholen({ abgeholt, pflege, herzen = 0, glueckspfote = false, zweites = false }, jetzt = new Date()) {
  if (!geschenkDa(abgeholt, jetzt, zweites)) return { muenzen: 0, abgeholt };
  const heute = schichtSchluessel(jetzt);
  const alt = lesenAbgeholt(abgeholt);
  const anzahl = alt.tag === heute ? alt.anzahl + 1 : 1;
  const voll = betrag({ pflegeVortag: pflegeVom(pflege, vortagSchluessel(jetzt)), herzen, glueckspfote });
  // Das zweite Päckchen ist kleiner – ein Bonus, kein zweiter Tageslohn
  return { muenzen: anzahl === 1 ? voll : Math.round(voll / 2), abgeholt: `${heute}|${anzahl}` };
}

/* Eine Pflegetätigkeit verbuchen. Neuer Schichttag: der alte wird Vortag. */
export function pflegen(pflege, art, jetzt = new Date()) {
  const tag = schichtSchluessel(jetzt);
  const plus = PFLEGE[art] ?? 0;
  if (!pflege || pflege.tag !== tag) {
    const vortag = pflege ? { tag: pflege.tag, punkte: pflege.punkte } : null;
    return { tag, punkte: Math.min(GESCHENK.pflegeMax, plus), vortag };
  }
  return { ...pflege, punkte: Math.min(GESCHENK.pflegeMax, pflege.punkte + plus) };
}

export function pflegeLesen(roh) {
  let d;
  try { d = JSON.parse(roh); } catch { return null; }
  if (!d || typeof d.tag !== 'string' || !Number.isFinite(d.punkte)) return null;
  const v = d.vortag;
  const vortag = v && typeof v.tag === 'string' && Number.isFinite(v.punkte) ? { tag: v.tag, punkte: v.punkte } : null;
  return { tag: d.tag, punkte: Math.min(GESCHENK.pflegeMax, Math.max(0, d.punkte)), vortag };
}

export const HEILUNG = { dauer: 12 * 3_600_000, schwelle: 40 };

/* Kranke Katze: läuft die Uhr für die Selbstheilung, und ist sie abgelaufen? */
export function selbstheilung({ krank, hunger, durst, gutSeit }, jetzt = Date.now()) {
  if (!krank) return { gutSeit: null, heilt: false };
  const gut = hunger >= HEILUNG.schwelle && durst >= HEILUNG.schwelle;
  if (!gut) return { gutSeit: null, heilt: false };
  if (gutSeit === null || gutSeit === undefined) return { gutSeit: jetzt, heilt: false };
  if (jetzt - gutSeit >= HEILUNG.dauer) return { gutSeit: null, heilt: true };
  return { gutSeit, heilt: false };
}
