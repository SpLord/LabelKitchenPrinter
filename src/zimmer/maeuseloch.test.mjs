import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAUS, mausPlan, launeFuer, vorDemLoch } from './maeuseloch.js';

const folge = (werte) => { let i = 0; return () => werte[i++ % werte.length]; };

test('mausPlan: Auftritte liegen in der Spielzeit und überlappen nicht', () => {
  const plan = mausPlan(Math.random);
  assert.ok(plan.length >= 12, `nur ${plan.length}`);
  for (let i = 0; i < plan.length; i += 1) {
    const m = plan[i];
    assert.ok(m.ab >= MAUS.vorlauf && m.ab + m.zeigt <= MAUS.dauer, JSON.stringify(m));
    assert.ok(m.loch >= 0 && m.loch < MAUS.loecher.length);
    if (i > 0) assert.ok(m.ab >= plan[i - 1].ab + plan[i - 1].zeigt, 'überlappt');
  }
});

test('mausPlan: wird schneller – späte Mäuse zeigen sich kürzer', () => {
  const plan = mausPlan(() => 0.5);
  assert.ok(plan[plan.length - 1].zeigt < plan[0].zeigt);
  assert.ok(plan[plan.length - 1].zeigt >= MAUS.zeigtMin);
});

test('mausPlan: nie zweimal hintereinander dasselbe Loch', () => {
  const plan = mausPlan(folge([0.1, 0.1, 0.1, 0.9, 0.9]));
  for (let i = 1; i < plan.length; i += 1) assert.notEqual(plan[i].loch, plan[i - 1].loch);
});

test('launeFuer: je Treffer etwas Laune, gedeckelt', () => {
  assert.equal(launeFuer(0), 0);
  assert.equal(launeFuer(3), 3 * MAUS.launeJeTreffer);
  assert.equal(launeFuer(99), MAUS.launeMax);
});

test('vorDemLoch: die Katze springt auf den Boden vor dem Loch', () => {
  const z = vorDemLoch(0);
  assert.equal(z.x, MAUS.loecher[0].x);
  assert.ok(z.y > 560 && z.y < 600);
});
