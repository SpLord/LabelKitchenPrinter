import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FREI, freiLohn } from './frei.js';

test('Freies Spiel: Lohn nach Punkten, gedeckelt', () => {
  assert.equal(freiLohn(FREI.lohnJe - 1), 0);
  assert.equal(freiLohn(FREI.lohnJe * 5), 5);
  assert.equal(freiLohn(1e6), FREI.lohnMax);
  assert.equal(freiLohn(-5), 0);
});
