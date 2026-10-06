import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FEDER, LECKERLI, fallplan, gefangen, inReichweite, muenzenFuerRunde, wartezeit, zielUnterFeder,
} from './spiele.js';

const fest = (wert) => () => wert;

test('Fallplan: richtige Anzahl, alles innerhalb der Runde und des Bildes', () => {
  const plan = fallplan();
  assert.equal(plan.length, LECKERLI.anzahl);
  for (const l of plan) {
    assert.ok(l.x >= LECKERLI.links && l.x <= LECKERLI.rechts, `x ${l.x}`);
    assert.ok(l.ab + l.fallzeit <= LECKERLI.dauer, `endet nach der Runde: ${l.ab + l.fallzeit}`);
    assert.ok(l.fallzeit >= 1500, 'nie unfangbar schnell');
  }
});

test('Fallplan: später fallen sie schneller', () => {
  const plan = fallplan(fest(0.5));
  assert.ok(plan[plan.length - 1].fallzeit < plan[0].fallzeit);
});

test('Fallplan: gleicher Zufall, gleicher Plan', () => {
  assert.deepEqual(fallplan(fest(0.3)), fallplan(fest(0.3)));
});

test('Fangen: der Napf muss darunter stehen', () => {
  assert.equal(gefangen(500, 500), true);
  assert.equal(gefangen(500, 500 + LECKERLI.napfBreite / 2), true);
  assert.equal(gefangen(500, 500 + LECKERLI.napfBreite / 2 + 1), false);
});

test('Münzen: höchstens zehn je Runde, nie negativ', () => {
  assert.equal(muenzenFuerRunde(4), 4);
  assert.equal(muenzenFuerRunde(18), LECKERLI.maxMuenzen);
  assert.equal(muenzenFuerRunde(-3), 0);
});

test('Pause: eine Runde pro Stunde', () => {
  const jetzt = 1_000_000_000;
  assert.equal(wartezeit(null, jetzt), 0, 'noch nie gespielt');
  assert.equal(wartezeit(jetzt - LECKERLI.pause, jetzt), 0);
  assert.equal(wartezeit(jetzt - 10 * 60_000, jetzt), 50 * 60_000);
  assert.equal(wartezeit('kaputt', jetzt), 0, 'kaputter Speicher sperrt nicht');
});

test('Federangel: nur erreichbar, wenn die Feder tief hängt und nah ist', () => {
  const katze = { x: 500, y: 640 };
  assert.equal(inReichweite(katze, { x: 520, y: 620 }), true);
  assert.equal(inReichweite(katze, { x: 520, y: FEDER.tiefMin - 1 }), false, 'zu hoch');
  assert.equal(inReichweite(katze, { x: 700, y: 620 }), false, 'zu weit');
});

test('Federangel: die Katze bleibt beim Hinterherlaufen auf dem Boden', () => {
  assert.deepEqual(zielUnterFeder({ x: 50, y: 100 }), { x: 160, y: 570 });
  assert.deepEqual(zielUnterFeder({ x: 2000, y: 900 }), { x: 980, y: 680 });
});
