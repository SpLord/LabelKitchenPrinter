import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FREUDE_VERFALL_PRO_STUNDE, KRANK_NACH_STUNDEN, KRANK_SCHWELLE, STUFEN,
  bedarf, ertrag, freudeVerfall, gesamtzustand, schlaeft, wirdKrank,
} from './tamagotchi.js';

const um = (h) => new Date(`2026-08-31T${String(h).padStart(2, '0')}:30:00`);
const satt = { hunger: 90, thirst: 90, freude: 60 };

test('tamagotchi: nachts schläft sie, tagsüber nicht', () => {
  assert.equal(schlaeft(um(23)), true);
  assert.equal(schlaeft(um(3)), true);
  assert.equal(schlaeft(um(5)), true);
  assert.equal(schlaeft(um(6)), false);
  assert.equal(schlaeft(um(14)), false);
  assert.equal(schlaeft(um(21)), false);
  assert.equal(schlaeft(um(22)), true);
});

test('tamagotchi: Zufriedenheit fällt schneller, wenn etwas fehlt', () => {
  assert.equal(freudeVerfall({ hunger: 90, thirst: 90 }), FREUDE_VERFALL_PRO_STUNDE);
  assert.ok(freudeVerfall({ hunger: 10, thirst: 90 }) > FREUDE_VERFALL_PRO_STUNDE, 'Hunger zieht');
  assert.ok(freudeVerfall({ hunger: 90, thirst: 90, haeufchen: 3 }) > FREUDE_VERFALL_PRO_STUNDE, 'Dreck zieht');
  // Häufchen zählen nur bis vier, sonst wird es unfair
  assert.equal(freudeVerfall({ hunger: 90, thirst: 90, haeufchen: 9 }),
               freudeVerfall({ hunger: 90, thirst: 90, haeufchen: 4 }));
});

test('tamagotchi: krank wird sie nur nach anhaltender Not', () => {
  const jetzt = Date.now();
  const knapp = jetzt - (KRANK_NACH_STUNDEN - 1) * 3_600_000;
  const lange = jetzt - (KRANK_NACH_STUNDEN + 1) * 3_600_000;

  assert.equal(wirdKrank({ hunger: 5, thirst: 90, notSeit: knapp, krank: false }, jetzt), false, 'noch nicht lange genug');
  assert.equal(wirdKrank({ hunger: 5, thirst: 90, notSeit: lange, krank: false }, jetzt), true);
  assert.equal(wirdKrank({ hunger: 90, thirst: 90, notSeit: lange, krank: false }, jetzt), false, 'wieder satt');
  assert.equal(wirdKrank({ hunger: 90, thirst: 90, notSeit: null, krank: true }, jetzt), true, 'bleibt krank bis zur Medizin');
  assert.equal(wirdKrank({ hunger: KRANK_SCHWELLE, thirst: 90, notSeit: lange, krank: false }, jetzt), false, 'genau auf der Schwelle');
});

test('tamagotchi: Krankheit schlägt alles andere', () => {
  assert.equal(gesamtzustand({ ...satt, krank: true }, um(14)).key, 'krank');
  assert.equal(gesamtzustand({ ...satt, krank: true }, um(23)).key, 'krank', 'auch nachts');
});

test('tamagotchi: Schlaf schlägt die Bedürfnisse', () => {
  assert.equal(gesamtzustand(satt, um(23)).key, 'schlaeft');
  assert.equal(gesamtzustand({ hunger: 10, thirst: 10 }, um(23)).key, 'schlaeft');
});

test('tamagotchi: hohe Zufriedenheit hebt über munter hinaus', () => {
  assert.equal(gesamtzustand({ hunger: 90, thirst: 90, freude: 90 }, um(14)).key, 'gluecklich');
  assert.equal(gesamtzustand({ hunger: 90, thirst: 90, freude: 40 }, um(14)).key, 'munter');
  // Ohne erfüllte Grundbedürfnisse hilft Zufriedenheit nicht
  assert.equal(gesamtzustand({ hunger: 20, thirst: 90, freude: 100 }, um(14)).key, 'traege');
});

test('tamagotchi: Ertrag folgt dem Zustand', () => {
  assert.equal(ertrag(2, { hunger: 90, thirst: 90, freude: 90 }, um(14)), 4, 'glücklich verdoppelt');
  assert.equal(ertrag(2, { hunger: 90, thirst: 90, freude: 40 }, um(14)), 3);
  assert.equal(ertrag(2, { hunger: 50, thirst: 50 }, um(14)), 2);
  assert.equal(ertrag(2, { hunger: 20, thirst: 20 }, um(14)), 1);
  assert.equal(ertrag(2, { hunger: 5, thirst: 5 }, um(14)), 0);
  assert.equal(ertrag(2, satt, um(23)), 0, 'im Schlaf nichts');
  assert.equal(ertrag(2, { ...satt, krank: true }, um(14)), 0, 'krank nichts');
});

test('tamagotchi: Ertrag ist nie negativ oder gebrochen', () => {
  for (const h of [0, 14, 15, 39, 40, 69, 70, 100]) {
    const v = ertrag(3, { hunger: h, thirst: h, freude: h }, um(14));
    assert.ok(Number.isInteger(v) && v >= 0, `ungültig bei ${h}: ${v}`);
  }
});

test('tamagotchi: Bedarf nennt beim Namen, was fehlt', () => {
  assert.deepEqual(bedarf({ hunger: 90, thirst: 90, freude: 90 }), []);
  assert.deepEqual(bedarf({ hunger: 20, thirst: 90, freude: 90 }), ['hunger']);
  assert.deepEqual(bedarf({ hunger: 90, thirst: 20, freude: 90 }), ['durst']);
  assert.deepEqual(bedarf({ hunger: 90, thirst: 90, freude: 10 }), ['langeweile']);
  assert.deepEqual(bedarf({ hunger: 90, thirst: 90, freude: 90, haeufchen: 4 }), ['dreck']);
  assert.ok(bedarf({ hunger: 90, thirst: 90, krank: true }).includes('krank'));
});

test('tamagotchi: Stufen sind vollständig und eindeutig', () => {
  const keys = STUFEN.map((s) => s.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(STUFEN.every((s) => s.emoji && s.label && typeof s.faktor === 'number' && s.faktor >= 0));
});
