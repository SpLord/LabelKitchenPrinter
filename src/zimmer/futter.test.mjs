import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FUTTER, passtRein } from './futter.js';

test('Futter: fünf Sorten, eindeutige ids, sinnvolle Werte', () => {
  assert.equal(FUTTER.length, 5);
  assert.equal(new Set(FUTTER.map((f) => f.id)).size, 5);
  for (const f of FUTTER) {
    assert.ok(f.preis > 0 && f.menge > 0 && f.menge <= 100, f.id);
    assert.ok(f.name && f.text, f.id);
  }
});

test('Futter: Teureres sättigt je Münze mindestens so gut wie Trockenfutter (ausser Milch, die tränkt)', () => {
  const basis = FUTTER[0].menge / FUTTER[0].preis;
  for (const f of FUTTER.filter((x) => x.id !== 'milch')) assert.ok(f.menge / f.preis >= basis - 0.01, f.id);
  assert.ok(FUTTER.find((f) => f.id === 'milch').durst > 0);
});

test('Futter: in den Napf passt nie mehr als bis voll', () => {
  const fest = FUTTER.find((f) => f.id === 'festmahl');
  assert.equal(passtRein(0, fest), 100);
  assert.equal(passtRein(70, fest), 30);
  assert.equal(passtRein(100, FUTTER[0]), 0);
});
