import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FREUNDSCHAFT_MAX, FREUNDSCHAFT_TAG, PHASEN,
  bisNaechstePhase, herzen, mehrFreundschaft, phase, tagesSchluessel, zaehleTag,
} from './wachstum.js';

test('wachstum: Phasen nach gepflegten Tagen', () => {
  assert.equal(phase(0).key, 'kitten');
  assert.equal(phase(2).key, 'kitten');
  assert.equal(phase(3).key, 'jung');
  assert.equal(phase(9).key, 'jung');
  assert.equal(phase(10).key, 'ausgewachsen');
  assert.equal(phase(500).key, 'ausgewachsen');
});

test('wachstum: Phasen halten auch Unsinn aus', () => {
  assert.equal(phase(undefined).key, 'kitten');
  assert.equal(phase(-5).key, 'kitten');
  assert.equal(phase(NaN).key, 'kitten');
});

test('wachstum: Kitten ist kleiner, ausgewachsen volle Grösse', () => {
  assert.ok(phase(0).groesse < phase(3).groesse);
  assert.ok(phase(3).groesse < phase(10).groesse);
  assert.equal(phase(10).groesse, 1);
  assert.ok(PHASEN.every((p) => p.groesse > 0 && p.groesse <= 1));
});

test('wachstum: Weg zur nächsten Phase', () => {
  assert.deepEqual(bisNaechstePhase(0).fehlt, 3);
  assert.equal(bisNaechstePhase(2).phase.key, 'jung');
  assert.equal(bisNaechstePhase(9).fehlt, 1);
  assert.equal(bisNaechstePhase(10), null, 'ganz oben');
});

test('wachstum: Freundschaft wächst und fällt nie', () => {
  assert.equal(mehrFreundschaft(10, 5), 15);
  assert.equal(mehrFreundschaft(98, 5), FREUNDSCHAFT_MAX, 'gedeckelt');
  assert.equal(mehrFreundschaft(10, -5), 10, 'negatives wirkt nicht');
  assert.equal(mehrFreundschaft(NaN, 5), 5);
  assert.equal(mehrFreundschaft(-20, 5), 5, 'kein negativer Ausgangswert');
});

test('wachstum: Herzen', () => {
  assert.equal(herzen(0), 0);
  assert.equal(herzen(1), 1, 'schon ein Punkt zeigt ein Herz');
  assert.equal(herzen(20), 1);
  assert.equal(herzen(21), 2);
  assert.equal(herzen(100), 5);
  assert.equal(herzen(999), 5);
  assert.equal(herzen(-5), 0);
});

test('wachstum: Tagesschlüssel ist das Ortsdatum', () => {
  assert.equal(tagesSchluessel(new Date('2026-08-31T23:30:00')), '2026-08-31');
  assert.equal(tagesSchluessel(new Date('2026-01-05T00:10:00')), '2026-01-05');
});

test('wachstum: ein gepflegter Tag zählt einmal', () => {
  const heute = new Date('2026-08-31T14:00:00');
  const start = { gepflegteTage: 4, letzterTag: null, freundschaft: 10 };

  const erst = zaehleTag(start, 'munter', heute);
  assert.equal(erst.neuerTag, true);
  assert.equal(erst.gepflegteTage, 5);
  assert.equal(erst.freundschaft, 10 + FREUNDSCHAFT_TAG);

  const nochmal = zaehleTag(erst, 'munter', heute);
  assert.equal(nochmal.neuerTag, false, 'nicht zweimal am selben Tag');
  assert.equal(nochmal.gepflegteTage, 5);
});

test('wachstum: schlechte Tage zählen nicht, kosten aber auch nichts', () => {
  const heute = new Date('2026-08-31T14:00:00');
  const start = { gepflegteTage: 4, letzterTag: null, freundschaft: 10 };
  for (const schlecht of ['schwach', 'krank']) {
    const r = zaehleTag(start, schlecht, heute);
    assert.equal(r.neuerTag, false);
    assert.equal(r.gepflegteTage, 4, 'kein Rückschritt');
    assert.equal(r.freundschaft, 10, 'Freundschaft bleibt');
  }
});

test('wachstum: schlafend zählt als in Ordnung', () => {
  const r = zaehleTag({ gepflegteTage: 0, letzterTag: null, freundschaft: 0 }, 'schlaeft', new Date('2026-08-31T23:30:00'));
  assert.equal(r.neuerTag, true, 'nachts ist sie nicht vernachlässigt, sie schläft');
});

test('wachstum: am nächsten Tag zählt es wieder', () => {
  const a = zaehleTag({ gepflegteTage: 0, letzterTag: null, freundschaft: 0 }, 'munter', new Date('2026-08-31T14:00:00'));
  const b = zaehleTag(a, 'munter', new Date('2026-09-01T09:00:00'));
  assert.equal(b.gepflegteTage, 2);
  assert.equal(b.letzterTag, '2026-09-01');
});
