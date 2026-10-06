import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dauerInWorten } from './dauer.js';
import { DECAY_PER_HOUR, NEED_MAX } from './needs.js';

test('dauerInWorten: unter einem Tag', () => {
  assert.equal(dauerInWorten(8), 'weniger als ein Tag');
  assert.equal(dauerInWorten(23.9), 'weniger als ein Tag');
});

test('dauerInWorten: gut N Tage bis zur halben Tagesmarke, danach knapp N+1', () => {
  assert.equal(dauerInWorten(24), 'genau ein Tag');
  assert.equal(dauerInWorten(30), 'gut ein Tag');
  assert.equal(dauerInWorten(83), 'gut drei Tage');
  assert.equal(dauerInWorten(48 + 13), 'knapp drei Tage');
  assert.equal(dauerInWorten(72), 'genau drei Tage');
});

test('dauerInWorten: große Werte als Ziffern, Unsinn fängt es ab', () => {
  assert.equal(dauerInWorten(24 * 20), 'genau 20 Tage');
  assert.equal(dauerInWorten(NaN), 'unbekannt lange');
  assert.equal(dauerInWorten(-5), 'unbekannt lange');
});

test('dauerInWorten: bei der aktuellen Rate ist es keine Schicht', () => {
  const satz = dauerInWorten(Math.round(NEED_MAX / DECAY_PER_HOUR));
  assert.doesNotMatch(satz, /Schicht/);
});
