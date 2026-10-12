import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  amBoden, BLASEN, blaseNeu, blaseHoehe, blaseWeg, blasenLaune,
  NACHMACHEN, nachmachenStart, naechsteRunde, nachmachenTipp, nachmachenRunden, nachmachenLohn,
  WOLLE, wurfZiel, angekommen, wolleLaune,
} from './spiele3.js';

test('amBoden: Ziele bleiben auf der freien Bodenfläche', () => {
  assert.deepEqual(amBoden({ x: 0, y: 100 }), { x: 180, y: 580 });
  assert.deepEqual(amBoden({ x: 2000, y: 2000 }), { x: 960, y: 675 });
  assert.deepEqual(amBoden({ x: 500, y: 620 }), { x: 500, y: 620 });
});

test('Blasen: steigen gleichmässig vom Boden zur Decke und sind dann weg', () => {
  const b = blaseNeu(1, 1000, () => 0.5);
  assert.ok(b.x >= 200 && b.x <= 920);
  assert.ok(b.dauer >= BLASEN.steigen[0] && b.dauer <= BLASEN.steigen[1]);
  assert.equal(blaseHoehe(b, 1000), BLASEN.start);
  assert.equal(blaseHoehe(b, 1000 + b.dauer), BLASEN.ende);
  const mitte = blaseHoehe(b, 1000 + b.dauer / 2);
  assert.ok(mitte < BLASEN.start && mitte > BLASEN.ende);
  assert.equal(blaseWeg(b, 1000 + b.dauer - 1), false);
  assert.equal(blaseWeg(b, 1000 + b.dauer), true);
});

test('Blasen: Laune je Blase, gedeckelt', () => {
  assert.equal(blasenLaune(0), 0);
  assert.equal(blasenLaune(3), 3 * BLASEN.laune);
  assert.equal(blasenLaune(999), BLASEN.launeMax);
});

test('Nachmachen: richtige Folge schafft die Runde, die nächste ist eins länger', () => {
  let s = { ...nachmachenStart(() => 0.1), phase: 'nachmachen' };
  assert.deepEqual(s.folge, [0]);
  s = nachmachenTipp(s, 0);
  assert.equal(s.phase, 'geschafft');
  assert.equal(nachmachenRunden(s), 1);
  s = naechsteRunde(s, () => 0.9);
  assert.deepEqual(s.folge, [0, 3]);
  assert.equal(s.phase, 'zeigen');
  // Während sie zeigt, zählt kein Tipp
  assert.equal(nachmachenTipp(s, 0), s);
  s = { ...s, phase: 'nachmachen' };
  s = nachmachenTipp(s, 0);
  assert.equal(s.phase, 'nachmachen');
  assert.equal(s.eingabe, 1);
  s = nachmachenTipp(s, 1);
  assert.equal(s.phase, 'falsch');
  assert.equal(nachmachenRunden(s), 1);
});

test('Nachmachen: nach der letzten Runde ist Schluss, Lohn je Runde', () => {
  const folge = Array.from({ length: NACHMACHEN.runden }, (_, i) => i % 4);
  let s = { folge, eingabe: 0, phase: 'nachmachen' };
  for (const k of folge) s = nachmachenTipp(s, k);
  assert.equal(s.phase, 'fertig');
  assert.equal(nachmachenRunden(s), NACHMACHEN.runden);
  assert.equal(nachmachenLohn(3), 3 * NACHMACHEN.lohnJe);
  assert.equal(nachmachenLohn(99), NACHMACHEN.runden * NACHMACHEN.lohnJe);
  assert.equal(nachmachenLohn(-1), 0);
});

test('Apportieren: Wurfziel auf dem Boden, angekommen erst in der Nähe', () => {
  assert.deepEqual(wurfZiel({ x: 600, y: 200 }), { x: 600, y: 580 });
  assert.equal(angekommen({ x: 500, y: 640 }, { x: 520, y: 650 }), true);
  assert.equal(angekommen({ x: 500, y: 640 }, { x: 600, y: 640 }), false);
  assert.equal(angekommen(WOLLE.heim, WOLLE.heim), true);
  assert.equal(wolleLaune(2), 2 * WOLLE.laune);
  assert.equal(wolleLaune(100), WOLLE.launeMax);
});
