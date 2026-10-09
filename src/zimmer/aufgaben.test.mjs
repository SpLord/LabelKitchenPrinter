import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUFGABEN, DRUCK, aufgabenFuer, zaehlen, abholbar, abholen, aufgabenLesen, druckLohn,
} from './aufgaben.js';

const T = (d = 9, h = 12) => new Date(2026, 9, d, h);

test('aufgabenFuer: drei verschiedene je Schichttag, am selben Tag immer dieselben', () => {
  const a = aufgabenFuer('2026-10-09');
  assert.equal(a.length, 3);
  assert.equal(new Set(a).size, 3);
  assert.deepEqual(aufgabenFuer('2026-10-09'), a);
  const tage = new Set();
  for (let d = 1; d <= 20; d += 1) tage.add(aufgabenFuer(`2026-10-${String(d).padStart(2, '0')}`).join());
  assert.ok(tage.size > 5, 'wechselt über die Tage');
  for (const id of a) assert.ok(AUFGABEN[id], id);
});

test('zaehlen: zählt je Schichttag, neuer Tag fängt bei null an', () => {
  let s = zaehlen(null, 'fuettern', 1, T(9, 9));
  s = zaehlen(s, 'fuettern', 1, T(9, 10));
  assert.equal(s.zaehler.fuettern, 2);
  const morgen = zaehlen(s, 'fuettern', 1, T(10, 9));
  assert.equal(morgen.zaehler.fuettern, 1);
  assert.deepEqual(morgen.abgeholt, []);
});

test('abholbar und abholen: erst wenn erfüllt, nur einmal', () => {
  const tag = '2026-10-09';
  const id = aufgabenFuer(tag)[0];
  const ziel = AUFGABEN[id];
  let s = { tag, zaehler: {}, abgeholt: [] };
  assert.equal(abholbar(s, id), false);
  s = zaehlen(s, ziel.zaehlt, ziel.ziel, T(9));
  assert.equal(abholbar(s, id), true);
  const r = abholen(s, id);
  assert.equal(r.lohn, ziel.lohn);
  assert.equal(abholbar(r.stand, id), false);
  assert.equal(abholen(r.stand, id).lohn, 0);
});

test('abholen: Aufgabe, die heute nicht dran ist, bringt nichts', () => {
  const tag = '2026-10-09';
  const nicht = Object.keys(AUFGABEN).find((id) => !aufgabenFuer(tag).includes(id));
  const s = zaehlen({ tag, zaehler: {}, abgeholt: [] }, AUFGABEN[nicht].zaehlt, 99, T(9));
  assert.equal(abholen(s, nicht).lohn, 0);
});

test('druckLohn: 1 Münze je Etikett, höchstens DRUCK.max am Tag', () => {
  let s = null;
  let summe = 0;
  for (let i = 0; i < DRUCK.max + 5; i += 1) {
    const r = druckLohn(s, T(9));
    s = r.stand; summe += r.lohn;
  }
  assert.equal(summe, DRUCK.max);
  assert.equal(druckLohn(s, T(10, 9)).lohn, 1, 'nächster Tag wieder');
});

test('aufgabenLesen: Unsinn → null', () => {
  assert.equal(aufgabenLesen('{kaputt'), null);
  assert.deepEqual(aufgabenLesen(JSON.stringify({ tag: '2026-10-09', zaehler: { fuettern: 2, x: 'a' }, abgeholt: ['a', 3] })),
    { tag: '2026-10-09', zaehler: { fuettern: 2 }, abgeholt: ['a'] });
});
