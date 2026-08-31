/*
  Tamagotchi-Mechanik der Katze.

  Angelehnt an die Originale (Pflegeherzen, Hygiene, Krankheit, Schlafzyklus),
  aber an den Einsatzort angepasst: das hier läuft auf einem Tablet im
  Küchendienst. Deshalb bewusst OHNE Pflegefehler, Schimpfen und Tod – ein
  Werkzeug darf im Service keine Schuldgefühle machen und niemals den
  Etikettendruck stören. Vernachlässigung führt zu einer trägen, später
  kranken Katze, die nichts mehr einbringt. Mehr nicht.

  Reine Funktionen, damit die Regeln ohne Browser prüfbar sind.
*/

import { clampNeed, conditionOf } from './needs.js';

// ── Zufriedenheit ────────────────────────────────────────────────────────────

/* Fällt langsamer als Hunger; Spielen und Streicheln füllen sie. */
export const FREUDE_VERFALL_PRO_STUNDE = 6;
export const FREUDE_SPIEL = 12;   // gefangenes Spielzeug
export const FREUDE_STREICHELN = 3;
export const FREUDE_LECKERLI = 8;

/*
  Ungepflegtes zieht zusätzlich: Hunger oder Durst am Boden drücken die
  Zufriedenheit, herumliegende Häufchen ebenfalls. Das ist der Grund, warum
  Wegräumen jetzt etwas bringt.
*/
export const freudeVerfall = ({ hunger, thirst, haeufchen = 0 }) => {
  let rate = FREUDE_VERFALL_PRO_STUNDE;
  if (Math.min(clampNeed(hunger), clampNeed(thirst)) < 30) rate += 6;
  rate += Math.min(4, Math.max(0, haeufchen)) * 3;
  return rate;
};

// ── Schlaf ───────────────────────────────────────────────────────────────────

export const SCHLAF_VON = 22;   // Küche zu
export const SCHLAF_BIS = 6;

/* Nachts ruht sie: keine Sprüche, halber Verfall – kein Pflegefehler wie im Original. */
export const schlaeft = (jetzt = new Date()) => {
  const h = jetzt.getHours();
  return h >= SCHLAF_VON || h < SCHLAF_BIS;
};

export const VERFALL_FAKTOR_SCHLAF = 0.5;

// ── Krankheit ────────────────────────────────────────────────────────────────

/*
  Krank wird sie nur bei anhaltender Vernachlässigung, nicht als Zufall.
  Bedingung: Hunger oder Durst länger als sechs Stunden unter 15.
*/
export const KRANK_SCHWELLE = 15;
export const KRANK_NACH_STUNDEN = 6;

export const wirdKrank = ({ hunger, thirst, notSeit, krank }, jetzt = Date.now()) => {
  if (krank) return true;
  const wert = Math.min(clampNeed(hunger), clampNeed(thirst));
  if (wert >= KRANK_SCHWELLE || !notSeit) return false;
  return jetzt - notSeit >= KRANK_NACH_STUNDEN * 3_600_000;
};

/* Eine kranke Katze sammelt nichts mehr – das ist die ganze Strafe. */
export const MEDIZIN_PREIS = 40;
export const MEDIZIN_FUELLT = 35;

// ── Gesamtbild ───────────────────────────────────────────────────────────────

export const STUFEN = [
  { key: 'krank',    emoji: '🤒', label: 'krank',      faktor: 0 },
  { key: 'schlaeft', emoji: '😴', label: 'schläft',    faktor: 0 },
  { key: 'schwach',  emoji: '🙀', label: 'schwach',    faktor: 0 },
  { key: 'traege',   emoji: '😿', label: 'träge',      faktor: 0.5 },
  { key: 'normal',   emoji: '😺', label: 'zufrieden',  faktor: 1 },
  { key: 'munter',   emoji: '😸', label: 'munter',     faktor: 1.5 },
  { key: 'gluecklich', emoji: '😻', label: 'glücklich', faktor: 2 },
];

const stufe = (key) => STUFEN.find((s) => s.key === key);

/*
  Der Gesamtzustand. Reihenfolge ist Absicht: Krankheit schlägt alles, danach
  Schlaf, dann die Grundbedürfnisse, und erst zuoberst hebt hohe Zufriedenheit
  den Ertrag über das Normale.
*/
export const gesamtzustand = ({ hunger, thirst, freude = 50, krank = false }, jetzt = new Date()) => {
  if (krank) return stufe('krank');
  if (schlaeft(jetzt)) return stufe('schlaeft');

  const grund = conditionOf(hunger, thirst);
  if (grund.key === 'schwach' || grund.key === 'traege') return stufe(grund.key);
  if (grund.key === 'munter' && clampNeed(freude) >= 80) return stufe('gluecklich');
  return stufe(grund.key === 'munter' ? 'munter' : 'normal');
};

/* Münzertrag nach Gesamtzustand – ersetzt die frühere Rechnung nach Bedürfnissen. */
export const ertrag = (basis, lage, jetzt = new Date()) =>
  Math.max(0, Math.round(basis * gesamtzustand(lage, jetzt).faktor));

/* Was der Katze gerade fehlt – für ihre Sprüche und die Anzeige. */
export const bedarf = ({ hunger, thirst, freude = 50, haeufchen = 0, krank = false }) => {
  const liste = [];
  if (krank) liste.push('krank');
  if (clampNeed(hunger) < 40) liste.push('hunger');
  if (clampNeed(thirst) < 40) liste.push('durst');
  if (clampNeed(freude) < 35) liste.push('langeweile');
  if (haeufchen >= 3) liste.push('dreck');
  return liste;
};
