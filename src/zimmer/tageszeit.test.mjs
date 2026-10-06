import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tageszeit, LICHT, besucher } from './tageszeit.js';

const um = (h, m = 0) => new Date(2026, 9, 6, h, m);

test('tageszeit: Morgen, Tag, Abend, Nacht nach der echten Uhr', () => {
  assert.equal(tageszeit(um(6)), 'morgen');
  assert.equal(tageszeit(um(10)), 'tag');
  assert.equal(tageszeit(um(16, 59)), 'tag');
  assert.equal(tageszeit(um(18)), 'abend');
  assert.equal(tageszeit(um(22)), 'nacht');
  assert.equal(tageszeit(um(3)), 'nacht');
});

test('LICHT: jede Tageszeit hat Himmel, Abdunkeln und Lampe', () => {
  for (const z of ['morgen', 'tag', 'abend', 'nacht']) {
    const l = LICHT[z];
    assert.equal(l.himmel.length, 2);
    assert.ok(l.dunkel >= 0 && l.dunkel <= 0.5);
    assert.equal(typeof l.lampe, 'boolean');
  }
  assert.equal(LICHT.tag.lampe, false);
  assert.equal(LICHT.nacht.lampe, true);
  assert.ok(LICHT.nacht.dunkel > LICHT.abend.dunkel);
});

test('besucher: tagsüber Vogel oder Schmetterling, nachts die Motte', () => {
  assert.equal(besucher('tag', () => 0.1), 'vogel');
  assert.equal(besucher('tag', () => 0.9), 'schmetterling');
  assert.equal(besucher('morgen', () => 0.1), 'vogel');
  assert.equal(besucher('nacht', () => 0.5), 'motte');
});
