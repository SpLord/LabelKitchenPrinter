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
  assert.equal(naechsterSchritt(munter, zone, 600, () => 0.3).art, 'sitzen');
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

// ── 2.2.0: freie Böden unter den Spalten, Springen zwischen Ebenen ──────
import { freieBoeden, waehleEbene } from './kuechenkatze.js';

const R2 = (left, top, right, bottom) => ({ left, top, right, bottom });

test('freieBoeden: Lücke unter einer kurzen Spalte wird zum Boden', () => {
  const b = freieBoeden({
    fenster: { breite: 1024, hoehe: 768 },
    spalten: [R2(282, 128, 513, 618), R2(529, 128, 761, 950), R2(777, 128, 1008, 852)],
    hindernisse: [R2(16, 128, 266, 745)],
  });
  assert.equal(b.length, 1);
  assert.equal(b[0].links, 282 + KUECHENKATZE.abstand);
  assert.equal(b[0].rechts, 513 - KUECHENKATZE.abstand);
  assert.equal(b[0].boden, 768 - KUECHENKATZE.randUnten);
});

test('freieBoeden: zu niedrige Lücke zählt nicht', () => {
  const b = freieBoeden({ fenster: { breite: 1024, hoehe: 768 }, spalten: [R2(282, 128, 513, 700)], hindernisse: [] });
  assert.deepEqual(b, []);
});

test('freieBoeden: ein Hindernis in der Lücke (Fehlermeldung, Versionsanzeige) macht sie unbrauchbar', () => {
  const b = freieBoeden({
    fenster: { breite: 1024, hoehe: 768 },
    spalten: [R2(282, 128, 513, 500)],
    hindernisse: [R2(300, 700, 480, 740)],
  });
  assert.deepEqual(b, []);
});

test('freieBoeden: ist die Spalte nach oben weggescrollt, ist darunter wirklich Platz', () => {
  // In der Spalte kommt nichts mehr – der Bereich bis zum unteren Rand ist leer
  const b = freieBoeden({ fenster: { breite: 1024, hoehe: 768 }, spalten: [R2(282, -900, 513, -300)], hindernisse: [] });
  assert.equal(b.length, 1);
});

test('waehleEbene: meist bleibt sie, manchmal springt sie auf eine andere', () => {
  const ebenen = [{ id: 'kopf' }, { id: 'boden-0' }];
  assert.equal(waehleEbene(ebenen, 'kopf', () => 0.9).id, 'kopf');
  assert.equal(waehleEbene(ebenen, 'kopf', () => 0.05).id, 'boden-0');
  assert.equal(waehleEbene([{ id: 'kopf' }], 'kopf', () => 0.01).id, 'kopf');
  // Ihre Ebene ist weg (weggescrollt) → irgendeine andere
  assert.equal(waehleEbene(ebenen, 'boden-7', () => 0.9).id, 'kopf');
});

import { spruchZumEtikett } from './kuechenkatze.js';

test('spruchZumEtikett: nennt das Etikett, kurz, und kürzt lange Namen', () => {
  const s = spruchZumEtikett('Steak', () => 0);
  assert.ok(s.includes('Steak'));
  assert.ok(s.length <= 28, s);
  const lang = spruchZumEtikett('Sehr langer Name für eine Sauce mit Trüffel', () => 0.5);
  assert.ok(lang.length <= 28, lang);
  assert.ok(lang.includes('…'));
  assert.equal(spruchZumEtikett('', () => 0), 'Mjam!');
});

test('naechsterSchritt (2.3.0): beim Sitzen putzt sie sich manchmal oder gähnt', () => {
  const zone2 = { links: 500, rechts: 700, boden: 116 };
  const arten = new Set();
  for (let i = 0; i < 100; i += 1) arten.add(naechsterSchritt({ nacht: false, krank: false }, zone2, 600, () => i / 100 * 0.35).art);
  assert.ok(arten.has('sitzen'));
  assert.ok(arten.has('putzen'));
  assert.ok(arten.has('gaehnen'));
});
