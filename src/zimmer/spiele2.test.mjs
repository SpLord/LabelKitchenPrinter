import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LASER, gesprungen, VERSTECK, VERSTECKE, versteckWahl, versteckLohn,
  MEMORY, memoryMischen, memoryZug, memoryFertig, memoryLohn, abkuehlung,
} from './spiele2.js';

test('Laser: nah genug am Punkt heisst gesprungen', () => {
  assert.equal(gesprungen({ x: 500, y: 640 }, { x: 520, y: 640 }), true);
  assert.equal(gesprungen({ x: 500, y: 640 }, { x: 500 + LASER.fangRadius + 5, y: 640 }), false);
});

test('Versteck: wechselt das Versteck, nie zweimal dasselbe hintereinander', () => {
  let alt = -1;
  for (let i = 0; i < 30; i += 1) {
    const neu = versteckWahl(alt, () => (i % 7) / 7);
    assert.ok(neu >= 0 && neu < VERSTECKE.length);
    assert.notEqual(neu, alt);
    alt = neu;
  }
});

test('Versteck: Lohn je Fund, gedeckelt durch die Rundenzahl', () => {
  assert.equal(versteckLohn(0), 0);
  assert.equal(versteckLohn(2), 2 * VERSTECK.lohnJe);
  assert.equal(versteckLohn(99), VERSTECK.runden * VERSTECK.lohnJe);
});

test('Memory: zwölf Karten, jedes Bild genau zweimal', () => {
  const karten = memoryMischen(Math.random);
  assert.equal(karten.length, MEMORY.paare * 2);
  const zaehl = {};
  for (const k of karten) zaehl[k] = (zaehl[k] ?? 0) + 1;
  assert.ok(Object.values(zaehl).every((n) => n === 2));
});

test('Memory: Paar bleibt offen, falsches Paar dreht sich zurück, Züge zählen', () => {
  const karten = ['a', 'b', 'a', 'b'];
  let s = { karten, offen: [], gefunden: [], zuege: 0 };
  s = memoryZug(s, 0);
  assert.deepEqual(s.offen, [0]);
  s = memoryZug(s, 1);              // falsch
  assert.deepEqual(s.offen, [0, 1]);
  assert.equal(s.zuege, 1);
  s = memoryZug(s, 2);              // dritter Tipp schliesst das falsche Paar und öffnet neu
  assert.deepEqual(s.offen, [2]);
  s = memoryZug(s, 0);              // a + a
  assert.deepEqual(s.gefunden.sort(), [0, 2]);
  assert.deepEqual(s.offen, []);
  assert.equal(memoryZug(s, 0), s, 'gefundene Karte antippen ändert nichts');
  s = memoryZug(memoryZug(s, 1), 3);
  assert.equal(memoryFertig(s), true);
  assert.equal(s.zuege, 3);
});

test('Memory: weniger Züge, mehr Münzen', () => {
  assert.equal(memoryLohn(6), MEMORY.lohn[0][1]);
  assert.ok(memoryLohn(6) > memoryLohn(10));
  assert.ok(memoryLohn(10) > memoryLohn(40));
  assert.ok(memoryLohn(40) > 0);
});

test('abkuehlung: eine Stunde nach dem letzten Mal', () => {
  const jetzt = 10 * 3_600_000;
  assert.equal(abkuehlung(null, jetzt), 0);
  assert.equal(abkuehlung(jetzt - 10 * 60_000, jetzt), 50 * 60_000);
  assert.equal(abkuehlung(jetzt - 2 * 3_600_000, jetzt), 0);
});
