import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DREIER, dreierLohn, gueltig, hatZug, nachbarn, nachrutschen, neuesBrett, reihen, treffer, zug,
} from './dreier.js';

const { n: N } = DREIER;
/* Zufall mit Gedächtnis, damit Tests wiederholbar sind */
const zufallAus = (saat) => { let x = saat; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
/* Brett aus Buchstaben: f k m w e (Feder) */
const KURZ = { f: 'fisch', k: 'keks', m: 'maus', w: 'wolle', e: 'feder' };
const aus = (zeilen) => zeilen.join('').split('').map((c, i) => ({ id: i + 1, art: KURZ[c] }));

const BRETT = aus([
  'fkmwefk',
  'kmwefkm',
  'fkmwefk',
  'kmwefkm',
  'mwefkmw',
  'wefkmwe',
  'efkmwef',
]);

test('Dreier: Nachbarn nur waagrecht oder senkrecht, nicht über den Rand', () => {
  assert.equal(nachbarn(0, 1), true);
  assert.equal(nachbarn(0, N), true);
  assert.equal(nachbarn(0, N + 1), false);
  assert.equal(nachbarn(N - 1, N), false, 'Zeilenende → nächste Zeile ist kein Nachbar');
});

test('Dreier: Reihen werden waagrecht und senkrecht erkannt', () => {
  const b = aus(['fffkmwe', 'kmwefkm', 'kmwefkm', 'kfkmwef', 'mwefkmw', 'wefkmwe', 'efkmwef']);
  const r = reihen(b);
  assert.ok(r.some((x) => x.length === 3 && x.includes(0) && x.includes(2)), 'waagrecht oben links');
  assert.ok(r.some((x) => x.includes(N) && x.includes(2 * N) && x.includes(3 * N)), 'senkrecht links (k k k)');
  assert.equal(treffer(BRETT).size, 0);
});

test('Dreier: neues Brett hat keine fertigen Reihen, aber einen Zug', () => {
  for (let saat = 1; saat < 20; saat += 1) {
    const b = neuesBrett(zufallAus(saat));
    assert.equal(b.length, N * N);
    assert.equal(treffer(b).size, 0, `Saat ${saat}`);
    assert.equal(hatZug(b), true, `Saat ${saat}`);
    assert.equal(new Set(b.map((f) => f.id)).size, N * N, 'ids eindeutig');
  }
});

test('Dreier: nur ein Tausch, der eine Reihe ergibt, ist gültig', () => {
  // Zeile 0: f k m … – tauscht man k(1) mit f(7)? Spalte 0 ist f,k,f,k → nein.
  const b = aus(['fkfwefk', 'kfmefkm', 'fkmwefk', 'kmwefkm', 'mwefkmw', 'wefkmwe', 'efkmwef']);
  // Tausch 1 ↔ 8 (k nach unten, f nach oben): Zeile 0 wird f f f
  assert.equal(gueltig(b, 1, 8), true);
  assert.equal(gueltig(b, 3, 4), false);
  assert.equal(gueltig(b, 1, 9), false, 'diagonal');
});

test('Dreier: ein Zug lässt die Reihe platzen, alles rutscht nach, Punkte zählen', () => {
  const b = aus(['fkfwefk', 'kfmefkm', 'fkmwefk', 'kmwefkm', 'mwefkmw', 'wefkmwe', 'efkmwef']);
  const r = zug(b, 1, 8, zufallAus(3));
  assert.ok(r);
  assert.ok(r.punkte >= 3 * DREIER.punkteJe);
  assert.deepEqual(r.schritte[1].weg.slice().sort((x, y) => x - y).slice(0, 3), [0, 1, 2]);
  assert.equal(r.brett.length, N * N);
  assert.equal(r.brett.every(Boolean), true, 'keine Lücken');
  assert.equal(treffer(r.brett).size, 0, 'Ketten fertig aufgelöst');
  assert.equal(zug(b, 3, 4, zufallAus(3)), null);
});

test('Dreier: Viererreihe schenkt einen Zug', () => {
  // Zeile 0: f f k f … und darunter an Stelle 2 ein f → Tausch 2↔9 ergibt f f f f
  const b = aus(['ffkfwek', 'kmfwefm', 'fkmwefk', 'kmwefkm', 'mwefkmw', 'wefkmwe', 'efkmwef']);
  const r = zug(b, 2, 9, zufallAus(5));
  assert.ok(r);
  assert.ok(r.extra >= 1);
});

test('Dreier: Nachrutschen füllt von oben auf, bestehende behalten ihre id', () => {
  const b = [...BRETT];
  b[3 * N] = null;   // ein Loch in Spalte 0
  const { brett } = nachrutschen(b, zufallAus(1), 500);
  assert.equal(brett[3 * N].id, BRETT[2 * N].id, 'von oben nachgerutscht');
  assert.equal(brett[0].id, 500, 'oben neu');
  assert.equal(brett[0].neu, true);
});

test('Dreier: Lohn je 60 Punkte, höchstens 20', () => {
  assert.equal(dreierLohn(59), 0);
  assert.equal(dreierLohn(600), 10);
  assert.equal(dreierLohn(99_999), DREIER.lohnMax);
});
