import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONDITIONS, MAX_OFFLINE_DECAY, catchUp, clampNeed, coinsFor,
  conditionOf, conditionValue, decayOver, feed,
} from './needs.js';

test('needs: clampNeed hält 0..100 und fängt Unsinn ab', () => {
  assert.equal(clampNeed(150), 100);
  assert.equal(clampNeed(-20), 0);
  assert.equal(clampNeed(NaN), 100);
  assert.equal(clampNeed(undefined), 100);
  assert.equal(clampNeed(42), 42);
});

test('needs: der schlechtere Wert bestimmt den Zustand', () => {
  assert.equal(conditionValue(90, 10), 10);
  assert.equal(conditionOf(90, 10).key, 'schwach');
  assert.equal(conditionOf(80, 80).key, 'munter');
});

test('needs: jede Stufe wird an ihrer Grenze getroffen', () => {
  assert.equal(conditionOf(100, 100).key, 'munter');
  assert.equal(conditionOf(70, 70).key, 'munter');
  assert.equal(conditionOf(69, 69).key, 'normal');
  assert.equal(conditionOf(40, 40).key, 'normal');
  assert.equal(conditionOf(39, 39).key, 'traege');
  assert.equal(conditionOf(15, 15).key, 'traege');
  assert.equal(conditionOf(14, 14).key, 'schwach');
  assert.equal(conditionOf(0, 0).key, 'schwach');
});

test('needs: Münzgewinn folgt dem Zustand', () => {
  assert.equal(coinsFor(2, 100, 100), 3);   // munter, 1.5x
  assert.equal(coinsFor(2, 50, 50), 2);     // zufrieden
  assert.equal(coinsFor(2, 20, 20), 1);     // träge
  assert.equal(coinsFor(2, 5, 5), 0);       // schwach – gar nichts
  assert.equal(coinsFor(1, 5, 5), 0);
});

test('needs: Münzgewinn ist nie negativ oder gebrochen', () => {
  for (const h of [0, 14, 15, 39, 40, 69, 70, 100]) {
    const v = coinsFor(3, h, h);
    assert.ok(Number.isInteger(v) && v >= 0, `ungültig bei ${h}: ${v}`);
  }
});

test('needs: Verfall entspricht der Zeit', () => {
  assert.equal(decayOver(100, 3_600_000), 88);          // eine Stunde = 12
  assert.equal(decayOver(100, 8 * 3_600_000), 4);       // acht Stunden
  assert.equal(decayOver(10, 24 * 3_600_000), 0);       // nie unter 0
  assert.equal(decayOver(50, 0), 50);
  assert.equal(decayOver(50, -100), 50);
});

test('needs: Abwesenheit ist gedeckelt', () => {
  const nach = catchUp({ hunger: 100, thirst: 100, lastSeen: Date.now() - 30 * 24 * 3_600_000 });
  assert.equal(nach.hunger, 100 - MAX_OFFLINE_DECAY);
  assert.equal(nach.thirst, 100 - MAX_OFFLINE_DECAY);
});

test('needs: ohne lastSeen passiert nichts', () => {
  const nach = catchUp({ hunger: 60, thirst: 70, lastSeen: undefined });
  assert.deepEqual(nach, { hunger: 60, thirst: 70 });
});

test('needs: Füttern füllt auf, aber nicht über 100', () => {
  assert.equal(feed(50, 20), 70);
  assert.equal(feed(95, 35), 100);
  assert.equal(feed(50, -10), 50);
});

test('needs: Stufen sind absteigend sortiert (sonst greift find() falsch)', () => {
  const mins = CONDITIONS.map((c) => c.min);
  assert.deepEqual(mins, [...mins].sort((a, b) => b - a));
});

test('needs: fehlender Speicherwert darf nicht als 0 gelesen werden', () => {
  // Number(null) ist 0 und Number.isFinite(0) ist true – ohne ausdrückliche
  // Prüfung startete die Katze auf einem frischen Gerät bei 0 % statt satt.
  assert.equal(Number(null), 0, 'Annahme über das Verhalten von Number()');
  assert.equal(Number.isFinite(Number(null)), true, 'deshalb reicht isFinite nicht');
});
