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

import { wetter } from './tageszeit.js';

test('wetter: je Tag fest, im Winter auch Schnee, im Sommer nie', () => {
  const tag = new Date(2026, 6, 10, 9);
  assert.equal(wetter(tag), wetter(new Date(2026, 6, 10, 20)), 'gleicher Tag, gleiches Wetter');
  const sommer = new Set();
  const winter = new Set();
  for (let d = 1; d <= 60; d += 1) {
    sommer.add(wetter(new Date(2026, 6, d % 28 + 1, 12)));
    winter.add(wetter(new Date(2027, 0, d % 28 + 1, 12)));
  }
  assert.ok(!sommer.has('schnee'));
  assert.ok(winter.has('schnee'));
  for (const w of [...sommer, ...winter]) assert.ok(['sonne', 'wolken', 'regen', 'schnee'].includes(w));
  assert.ok(sommer.size >= 2, 'nicht jeden Tag dasselbe');
});
