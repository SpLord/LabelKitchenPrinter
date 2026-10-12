import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MUENZ_PAUSE, PAUSE_TEXT, pauseAnzeige, restPause } from './pause.js';

test('Pause: fünf Minuten nach der letzten Runde', () => {
  const jetzt = 1_000_000_000;
  assert.equal(MUENZ_PAUSE, 5 * 60_000);
  assert.equal(PAUSE_TEXT, 'alle 5 Minuten');
  assert.equal(restPause(null, jetzt), 0, 'noch nie gespielt');
  assert.equal(restPause('kaputt', jetzt), 0, 'kaputter Speicher sperrt nicht');
  assert.equal(restPause(jetzt - 60_000, jetzt), 4 * 60_000);
  assert.equal(restPause(jetzt - MUENZ_PAUSE, jetzt), 0);
});

test('Pause: Anzeige in Minuten, die letzte Minute in Sekunden', () => {
  assert.equal(pauseAnzeige(4 * 60_000 + 1), '5 min');
  assert.equal(pauseAnzeige(60_000), '1 min');
  assert.equal(pauseAnzeige(41_200), '42 s');
});
