import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAETZE, einrichtung } from './einrichtung.js';

test('ohne Besitz: Napf und Wassernapf, alles andere frei', () => {
  const e = einrichtung([]);
  assert.deepEqual([...e.moebel].sort(), ['napf', 'wassernapf']);
  assert.ok(e.frei.includes('kratzbaum'));
  assert.ok(e.frei.includes('hoehle'));
  assert.ok(!e.frei.includes('napf'));
});

test('gekaufte Ausstattung steht im Zimmer', () => {
  const e = einrichtung(['kratzbaum', 'trinkbrunnen', 'kuschelhoehle', 'futterautomat', 'halsband']);
  assert.ok(e.moebel.has('kratzbaum'));
  assert.ok(e.moebel.has('kuschelhoehle'));
  assert.ok(e.moebel.has('futterautomat'));
  // Brunnen ersetzt den Wassernapf
  assert.ok(e.moebel.has('trinkbrunnen'));
  assert.ok(!e.moebel.has('wassernapf'));
  // Zubehör ist kein Möbel
  assert.ok(!e.moebel.has('halsband'));
  assert.ok(!e.frei.includes('kratzbaum'));
  assert.ok(!e.frei.includes('hoehle'));
});

test('kaputter Besitz wirft nicht', () => {
  assert.deepEqual([...einrichtung(null).moebel].sort(), ['napf', 'wassernapf']);
  assert.deepEqual([...einrichtung('quatsch').moebel].sort(), ['napf', 'wassernapf']);
});

test('jeder freie Platz ist ein bekannter Stellplatz', () => {
  for (const p of einrichtung([]).frei) assert.ok(PLAETZE[p], p);
});
