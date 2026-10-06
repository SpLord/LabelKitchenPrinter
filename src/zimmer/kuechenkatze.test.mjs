import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KUECHENKATZE, freieZone, naechsterSchritt, blaseFuer } from './kuechenkatze.js';

const R = (left, right, top = 60, bottom = 110) => ({ left, right, top, bottom });

test('freieZone: zwischen dem letzten Knopf der Kopfleiste und der Karte', () => {
  const z = freieZone({ kopf: R(16, 1008, 12, 120), teile: [R(20, 265), R(278, 491)], karte: R(712, 1010, 10, 78) });
  assert.equal(z.links, 491 + KUECHENKATZE.abstand);
  assert.equal(z.rechts, 712 - KUECHENKATZE.abstand);
  assert.equal(z.boden, 120 - KUECHENKATZE.bodenEinzug);
});

test('freieZone: zu schmal → keine Katze statt einer über den Knöpfen', () => {
  const z = freieZone({ kopf: R(16, 1008, 12, 120), teile: [R(20, 600)], karte: R(650, 1010) });
  assert.equal(z, null);
});

test('freieZone: ohne Kopfleiste oder Karte keine Zone', () => {
  assert.equal(freieZone({ kopf: null, teile: [], karte: R(700, 1000) }), null);
  assert.equal(freieZone({ kopf: R(0, 1000, 0, 100), teile: [], karte: null }), null);
});

test('freieZone: leere Teile (Breite 0) zählen nicht', () => {
  const z = freieZone({ kopf: R(16, 1008, 12, 120), teile: [R(20, 265), R(0, 0)], karte: R(712, 1010) });
  assert.equal(z.links, 265 + KUECHENKATZE.abstand);
});

const zone = { links: 500, rechts: 700, boden: 116 };
const munter = { nacht: false, krank: false };

test('naechsterSchritt: nachts schläft sie, ohne zu laufen', () => {
  const s = naechsterSchritt({ ...munter, nacht: true }, zone, 600, () => 0.5);
  assert.equal(s.art, 'schlafen');
  assert.equal(s.x, 600);
});

test('naechsterSchritt: krank liegt sie', () => {
  assert.equal(naechsterSchritt({ ...munter, krank: true }, zone, 600, () => 0.1).art, 'liegen');
});

test('naechsterSchritt: tagsüber läuft sie an einen Punkt in der Zone', () => {
  const s = naechsterSchritt(munter, zone, 520, () => 0.9);
  assert.equal(s.art, 'laufen');
  const halb = KUECHENKATZE.groesse / 2;
  assert.ok(s.x >= zone.links + halb && s.x <= zone.rechts - halb, `x=${s.x}`);
  assert.ok(s.dauer >= KUECHENKATZE.minWeg);
});

test('naechsterSchritt: manchmal bleibt sie sitzen', () => {
  assert.equal(naechsterSchritt(munter, zone, 600, () => 0.1).art, 'sitzen');
});

test('naechsterSchritt: Zone schmaler als die Katze → sie sitzt in der Mitte', () => {
  const s = naechsterSchritt(munter, { links: 500, rechts: 560, boden: 116 }, 520, () => 0.9);
  assert.equal(s.art, 'sitzen');
  assert.equal(s.x, 530);
});

test('blaseFuer: dringendstes Bedürfnis zuerst, sonst keine Blase', () => {
  assert.equal(blaseFuer({ krank: true, bedarf: ['hunger'] }), 'krank');
  assert.equal(blaseFuer({ krank: false, bedarf: ['hunger', 'durst'] }), 'durst');
  assert.equal(blaseFuer({ krank: false, bedarf: ['hunger'] }), 'hunger');
  assert.equal(blaseFuer({ krank: false, bedarf: ['dreck'] }), null);
});
