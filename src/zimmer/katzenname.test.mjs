import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_NAME, MAX_LAENGE, putzeName } from './katzenname.js';

test('Standardname ist nicht der des Kochs', () => {
  assert.equal(STANDARD_NAME, 'Mieze');
});

test('putzeName: trimmt und kürzt, leer oder Unsinn → null', () => {
  assert.equal(putzeName('  Luna  '), 'Luna');
  assert.equal(putzeName('Prinzessin Pfötchen von der Küche').length, MAX_LAENGE);
  assert.equal(putzeName('   '), null);
  assert.equal(putzeName(null), null);
  assert.equal(putzeName(42), null);
  assert.equal(putzeName('Mo\nhrle'), 'Mo hrle');
});
