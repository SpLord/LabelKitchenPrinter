import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LECKERLI, PUNKTE, belohnung, gruppen, gueltig, hatZug, laeufe, mischen, nachbarn, restDosen, restKisten,
  restPfuetzen, startBrett, zug, leer,
} from './brett.js';

const zufallAus = (saat) => { let x = saat; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
const ARTEN = LECKERLI.slice(0, 5);
/* Brett aus Buchstaben: f k m w e (Feder), K = Kiste, D = Dose, R = Regenbogen; Grossbuchstaben-Spezial per Zusatz */
const KURZ = { f: 'fisch', k: 'keks', m: 'maus', w: 'wolle', e: 'feder' };
const brett = (zeilen, extra = {}) => {
  const felder = zeilen.join('').split('').map((c, i) => {
    if (c === 'K') return { id: i + 1, art: 'kiste', leben: 1 };
    if (c === 'D') return { id: i + 1, art: 'dose' };
    if (c === 'R') return { id: i + 1, art: 'regen' };
    return { id: i + 1, art: KURZ[c] };
  });
  Object.entries(extra.spezial ?? {}).forEach(([i, sp]) => { felder[i] = { ...felder[i], spezial: sp }; });
  return { n: zeilen.length, felder, pfuetzen: extra.pfuetzen ?? felder.map(() => 0), id: 1000 };
};
// Hintergrund ohne Reihen: diagonale Muster
const RUHIG = ['fkmwe', 'kmwef', 'mwefk', 'wefkm', 'efkmw'];

test('Brett: Nachbarn nur waagrecht/senkrecht und nicht über den Zeilenrand', () => {
  const s = brett(RUHIG);
  assert.equal(nachbarn(s, 0, 1), true);
  assert.equal(nachbarn(s, 0, 5), true);
  assert.equal(nachbarn(s, 4, 5), false);
  assert.equal(nachbarn(s, 0, 6), false);
});

test('Brett: Läufe und Gruppen – L-Form ist eine Gruppe', () => {
  const s = brett(['fffwe', 'fmwek', 'fwefk', 'wefkm', 'efkmw']);
  assert.equal(laeufe(s).length, 2);
  const gs = gruppen(s);
  assert.equal(gs.length, 1);
  assert.equal(gs[0].zellen.length, 5);
  assert.equal(belohnung(gs[0]), 'bombe');
});

test('Brett: aus 4 wird ein gestreiftes, aus 5 ein Regenbogen-Knäuel', () => {
  const vier = gruppen(brett(['ffffe', 'kmwef', 'mwefk', 'wefkm', 'efkmw']))[0];
  assert.equal(belohnung(vier), 'reihe');
  const senk = gruppen(brett(['fkmwe', 'fmwef', 'fwefk', 'fefkm', 'efkmw']))[0];
  assert.equal(belohnung(senk), 'spalte');
  const fuenf = gruppen(brett(['fffff', 'kmwek', 'mwefk', 'wefkm', 'efkmw']))[0];
  assert.equal(belohnung(fuenf), 'regen');
  const drei = gruppen(brett(['fffwe', 'kmwef', 'mwefk', 'wefkm', 'efkmw']))[0];
  assert.equal(belohnung(drei), null);
});

test('Zug: vier in einer Reihe lässt ein gestreiftes Leckerli an der Tauschstelle entstehen', () => {
  // Zeile 0: f f k f – tauscht man k(2) mit f darunter(7), ergibt das f f f f
  const s = brett(['ffkfe', 'kmfwf', 'mwekm', 'wekmw', 'ekmwe']);
  const r = zug(s, 2, 7, ARTEN, zufallAus(1));
  assert.ok(r);
  const entstanden = r.schritte[1].geboren;
  assert.deepEqual(entstanden, [2]);
  const neu = r.schritte[1].s.felder.find((f) => f.spezial === 'reihe');
  assert.ok(neu, 'gestreiftes Leckerli da');
  assert.equal(neu.art, 'fisch');
});

test('Zug: ein gestreiftes Leckerli in einer Reihe räumt seine ganze Zeile', () => {
  // Zeile 2 enthält ein gestreiftes m (reihe) an Stelle 12; Tausch 11↔16 bildet m m m senkrecht? – einfacher: waagrecht
  const s = brett(['fkmwe', 'kwefk', 'mmkmf', 'wefkm', 'efkmw'], { spezial: { 10: 'reihe' } });
  // Tausch 12 (k) ↔ 7 (e)? Wir brauchen m an 12: darüber 7 ist e, darunter 17 ist f. Tausch 12↔13 ergibt m m m k f
  const r = zug(s, 12, 13, ARTEN, zufallAus(2));
  assert.ok(r);
  const reihe = r.schritte[1].effekte.find((e) => e.art === 'reihe');
  assert.ok(reihe, 'Strahl ausgelöst');
  assert.ok(r.schritte[1].platzt.length >= 5, 'ganze Zeile weg');
});

test('Zug: Regenbogen-Knäuel mit einem Leckerli getauscht räumt alle dieser Sorte', () => {
  const s = brett(RUHIG.map((z, i) => (i === 0 ? `R${z.slice(1)}` : z)));
  const fische = s.felder.filter((f) => f.art === 'fisch').length;
  assert.equal(gueltig(s, 0, 1), true, 'Knäuel geht immer mit einem Leckerli');
  const r = zug(s, 0, 5, ARTEN, zufallAus(3));   // unter 0 liegt k (keks)
  assert.ok(r);
  assert.ok(r.schritte[1].effekte.some((e) => e.art === 'regen') || r.gesammelt.keks >= 4, 'Kekse weg');
  assert.ok(r.gesammelt.keks >= 4);
  assert.ok(fische > 0);
});

test('Zug: Kiste neben einer geplatzten Reihe zerbricht, zweilebige erst beim zweiten Mal', () => {
  const s = brett(['ffkfe', 'Kmfwf', 'mwekm', 'wekmw', 'ekmwe']);
  const r = zug(s, 2, 7, ARTEN, zufallAus(4));
  assert.ok(r.kisten >= 1);
  assert.equal(restKisten(r.s), 0);
  const zaeh = { ...s, felder: s.felder.map((f) => (f.art === 'kiste' ? { ...f, leben: 2 } : f)) };
  const r2 = zug(zaeh, 2, 7, ARTEN, zufallAus(4));
  assert.equal(r2.kisten, 0);
  assert.equal(r2.s.felder.find((f) => f.art === 'kiste').leben, 1);
});

test('Zug: Pfütze unter einer Reihe wird kleiner, Kisten lassen sich nicht tauschen', () => {
  const pf = Array(25).fill(0);
  pf[0] = 1; pf[1] = 2;
  const s = brett(['ffkfe', 'kmfwf', 'mwekm', 'wekmw', 'ekmwe'], { pfuetzen: pf });
  const r = zug(s, 2, 7, ARTEN, zufallAus(5));
  assert.equal(r.s.pfuetzen[0], 0);
  assert.equal(r.s.pfuetzen[1], 1);
  assert.equal(r.pfuetzen, 1);
  const mitKiste = brett(['Kfkfe', 'kmfwf', 'mwekm', 'wekmw', 'ekmwe']);
  assert.equal(gueltig(mitKiste, 0, 1), false);
});

test('Zug: Dose rutscht nach unten und wird dort eingesammelt', () => {
  // Dose in Spalte 2, Zeile 3; darunter in Zeile 4 räumt eine Reihe auf
  const s = brett(['fkmwe', 'kmwef', 'mwefk', 'weDkm', 'ffmfw']);
  // Tausch 22 (m) ↔ 17? Zeile 4 = f f m f w; über 22 liegt 17 = D (Dose, nicht tauschbar). Tausch 22 ↔ 21? ergibt f m f f – nein.
  // Stattdessen: Spalte 3 von Zeile 4 (f) mit Zeile 4 Spalte 2 (m) – f f f m w
  const r = zug(s, 22, 23, ARTEN, zufallAus(6));
  assert.ok(r);
  assert.equal(r.dosen, 1);
  assert.equal(restDosen(r.s), 0);
  assert.ok(r.punkte >= PUNKTE.dose);
});

test('Zug: ein Tausch ohne Reihe geht nicht', () => {
  const s = brett(RUHIG);
  assert.equal(zug(s, 0, 1, ARTEN, zufallAus(7)), null);
});

test('Start: Vorlage mit Kisten, Pfützen, Dosen – nichts liegt fertig, ein Zug geht', () => {
  for (let saat = 1; saat < 15; saat += 1) {
    const s = startBrett(['..d....', '.......', '..kK...', 'ppp....', '...P...', '.......', '.......'], ARTEN, zufallAus(saat));
    assert.equal(s.felder.length, 49);
    assert.equal(laeufe(s).length, 0);
    assert.equal(hatZug(s), true);
    assert.equal(restKisten(s), 2);
    assert.equal(restDosen(s), 1);
    assert.equal(restPfuetzen(s), 4);
  }
});

test('Mischen: Kisten und Dosen bleiben, danach geht ein Zug', () => {
  const s = startBrett(['k..d...', ...leer(7).slice(1)], ARTEN, zufallAus(9));
  const m = mischen(s, ARTEN, zufallAus(10));
  assert.equal(m.felder[0].art, 'kiste');
  assert.equal(m.felder[3].art, 'dose');
  assert.equal(hatZug(m), true);
  assert.equal(laeufe(m).length, 0);
});

test('Zufallsspiel: hundert Züge lang bleibt das Brett heil', () => {
  const z = zufallAus(42);
  let s = startBrett(['..d....', '.......', '..kK...', 'ppp....', '...P...', '.......', '.......'], ARTEN, z);
  let gespielt = 0;
  for (let runde = 0; runde < 100; runde += 1) {
    const paare = [];
    for (let i = 0; i < 49; i += 1) { if (i % 7 < 6) paare.push([i, i + 1]); if (i < 42) paare.push([i, i + 7]); }
    const p = paare.find(([a, b]) => gueltig(s, a, b));
    assert.ok(p, 'immer ein Zug möglich');
    const r = zug(s, p[0], p[1], ARTEN, z);
    s = r.s;
    gespielt += 1;
    assert.equal(s.felder.length, 49);
    assert.ok(s.felder.every(Boolean), 'keine Lücken');
    assert.equal(laeufe(s).length, 0, 'in Ruhe');
    assert.equal(new Set(s.felder.map((f) => f.id)).size, 49, 'ids eindeutig');
  }
  assert.equal(gespielt, 100);
});
