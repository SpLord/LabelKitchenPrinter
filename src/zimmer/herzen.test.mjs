import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FREISCHALTUNGEN, TAGESGRENZE, freigeschaltet, neuFreigeschaltet, freundschaftHeute, grenzeLesen,
} from './herzen.js';

const T = (h = 12) => new Date(2026, 9, 6, h);

test('Freischaltungen: fünf, je Herz eine, mit Text', () => {
  assert.deepEqual(FREISCHALTUNGEN.map((f) => f.herz), [1, 2, 3, 4, 5]);
  assert.ok(FREISCHALTUNGEN.every((f) => f.text.length > 10));
});

test('freigeschaltet: ab dem passenden Herz', () => {
  assert.equal(freigeschaltet(0, 'begruessen'), false);
  assert.equal(freigeschaltet(1, 'begruessen'), true);
  assert.equal(freigeschaltet(2, 'zweitesGeschenk'), false);
  assert.equal(freigeschaltet(3, 'zweitesGeschenk'), true);
  assert.equal(freigeschaltet(5, 'gibtsNicht'), false);
});

test('neuFreigeschaltet: nur was zwischen gesehen und jetzt dazukam', () => {
  assert.deepEqual(neuFreigeschaltet(1, 3).map((f) => f.herz), [2, 3]);
  assert.deepEqual(neuFreigeschaltet(3, 3), []);
  assert.deepEqual(neuFreigeschaltet(4, 2), []);
});

test('freundschaftHeute: je Quelle Tagesgrenze', () => {
  let stand = null;
  let summe = 0;
  for (let i = 0; i < 10; i += 1) {
    const r = freundschaftHeute(stand, 'streicheln', 1, T());
    stand = r.stand; summe += r.plus;
  }
  assert.equal(summe, TAGESGRENZE.streicheln);
});

test('freundschaftHeute: Quellen getrennt, neuer Schichttag setzt zurück', () => {
  let r = freundschaftHeute(null, 'spielen', 5, T());
  assert.equal(r.plus, TAGESGRENZE.spielen);
  r = freundschaftHeute(r.stand, 'fuettern', 1, T());
  assert.equal(r.plus, 1);
  // 4 Uhr am nächsten Morgen gehört noch zum Vortag (Schicht ab 5)
  const nacht = freundschaftHeute(r.stand, 'spielen', 1, new Date(2026, 9, 7, 4));
  assert.equal(nacht.plus, 0);
  const morgen = freundschaftHeute(r.stand, 'spielen', 1, new Date(2026, 9, 7, 6));
  assert.equal(morgen.plus, 1);
});

test('freundschaftHeute: unbekannte Quelle oder Unsinn bringt nichts', () => {
  assert.equal(freundschaftHeute(null, 'hack', 50, T()).plus, 0);
  assert.equal(freundschaftHeute(null, 'spielen', -3, T()).plus, 0);
});

test('grenzeLesen: Unsinn → null', () => {
  assert.equal(grenzeLesen('{kaputt'), null);
  assert.equal(grenzeLesen(JSON.stringify({ tag: 1 })), null);
  assert.deepEqual(grenzeLesen(JSON.stringify({ tag: '2026-10-06', streicheln: 2 })),
    { tag: '2026-10-06', streicheln: 2, spielen: 0, fuettern: 0 });
});
