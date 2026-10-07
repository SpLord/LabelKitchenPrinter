import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ORTE, PORTION, SCHWELLE, naechsteTaetigkeit, wegDauer, wirkung } from './verhalten.js';

const satt = { hunger: 80, durst: 80, napf: 50, moebel: new Set() };
const immer = (wert) => () => wert;

test('Rangfolge: krank schlägt alles', () => {
  const t = naechsteTaetigkeit({ ...satt, krank: true, nacht: true, durst: 5, hunger: 5 });
  assert.equal(t.art, 'liegen');
  assert.equal(t.blase, 'krank');
});

test('Rangfolge: nachts schläft sie, in der Höhle, wenn es eine gibt', () => {
  assert.equal(naechsteTaetigkeit({ ...satt, nacht: true }).art, 'schlafen');
  assert.deepEqual(naechsteTaetigkeit({ ...satt, nacht: true, moebel: new Set(['kuschelhoehle']) }).ort, ORTE.hoehle);
  assert.deepEqual(naechsteTaetigkeit({ ...satt, nacht: true }).ort, ORTE.liegen);
});

test('Rangfolge: Durst vor Hunger', () => {
  const t = naechsteTaetigkeit({ ...satt, durst: SCHWELLE - 1, hunger: 5 });
  assert.equal(t.art, 'trinken');
  assert.deepEqual(t.ort, ORTE.wasser);
  assert.equal(t.blase, 'durst');
});

test('Hunger mit gefülltem Napf: sie geht fressen', () => {
  const t = naechsteTaetigkeit({ ...satt, hunger: 20 });
  assert.equal(t.art, 'fressen');
  assert.deepEqual(t.ort, ORTE.napf);
});

test('Hunger bei leerem Napf: sie setzt sich davor und wartet', () => {
  const t = naechsteTaetigkeit({ ...satt, hunger: 20, napf: 0 });
  assert.equal(t.art, 'betteln');
  assert.equal(t.blase, 'hunger');
});

test('freie Zeit: Kratzbaum nur, wenn einer dasteht', () => {
  const arten = new Set();
  for (let i = 0; i < 200; i += 1) arten.add(naechsteTaetigkeit(satt).art);
  assert.ok(!arten.has('kratzen'));
  const mit = new Set();
  for (let i = 0; i < 400; i += 1) mit.add(naechsteTaetigkeit({ ...satt, moebel: new Set(['kratzbaum']) }).art);
  assert.ok(mit.has('kratzen'));
});

test('freie Zeit: Bummeln bleibt auf dem Boden', () => {
  for (const z of [0, 0.3, 0.6, 0.9999]) {
    // erster Wurf wählt die Tätigkeit, die nächsten den Ort
    let n = 0;
    const zufall = () => (n++ === 0 ? 0.45 : z);
    const t = naechsteTaetigkeit(satt, zufall);
    if (t.art !== 'bummeln') continue;
    assert.ok(t.ort.x >= 180 && t.ort.x <= 960, `x ${t.ort.x}`);
    assert.ok(t.ort.y >= 568 && t.ort.y <= 680, `y ${t.ort.y}`);
  }
});

test('Wirkung: Fressen leert den Napf um genau das Gefressene', () => {
  assert.deepEqual(wirkung('fressen', { hunger: 20, napf: 100 }), { hunger: PORTION, napf: -PORTION });
  // nie mehr, als im Napf ist
  assert.deepEqual(wirkung('fressen', { hunger: 20, napf: 10 }), { hunger: 10, napf: -10 });
  // nie über satt hinaus
  assert.deepEqual(wirkung('fressen', { hunger: 90, napf: 100 }), { hunger: 10, napf: -10 });
  assert.deepEqual(wirkung('fressen', { hunger: 100, napf: 100 }), {});
});

test('Wirkung: Trinken stillt Durst, Bummeln ändert nichts', () => {
  assert.ok(wirkung('trinken', {}).durst > 0);
  assert.deepEqual(wirkung('bummeln', {}), {});
});

test('Wegdauer wächst mit der Strecke, nie unter einer Sekunde', () => {
  assert.equal(wegDauer({ x: 0, y: 0 }, { x: 0, y: 0 }), 1000);
  assert.ok(wegDauer({ x: 0, y: 600 }, { x: 900, y: 600 }) > wegDauer({ x: 0, y: 600 }, { x: 300, y: 600 }));
});

test('Zufall kommt von aussen – gleiche Würfe, gleiche Wahl', () => {
  const a = naechsteTaetigkeit(satt, immer(0.1));
  const b = naechsteTaetigkeit(satt, immer(0.1));
  assert.deepEqual(a, b);
});

test('muss mal: mit Platz im Klo geht sie aufs Klo', () => {
  const t = naechsteTaetigkeit({ ...satt, mussMal: true, kloPlatz: true, moebel: new Set(['katzenklo']) });
  assert.equal(t.art, 'klo');
  assert.deepEqual(t.ort, ORTE.klo);
});

test('muss mal: ohne Klo oder bei vollem Klo macht sie irgendwo hin', () => {
  assert.equal(naechsteTaetigkeit({ ...satt, mussMal: true, kloPlatz: false }, immer(0.3)).art, 'haeufchen');
  const voll = naechsteTaetigkeit({ ...satt, mussMal: true, kloPlatz: false, moebel: new Set(['katzenklo']) }, immer(0.3));
  assert.equal(voll.art, 'haeufchen');
  assert.ok(voll.ort, 'sie läuft dafür an eine Stelle');
});

test('muss mal: Durst und Hunger gehen vor, krank und Nacht sowieso', () => {
  assert.equal(naechsteTaetigkeit({ ...satt, mussMal: true, durst: 10 }).art, 'trinken');
  assert.equal(naechsteTaetigkeit({ ...satt, mussMal: true, hunger: 10 }).art, 'fressen');
  assert.equal(naechsteTaetigkeit({ ...satt, mussMal: true, nacht: true }).art, 'schlafen');
});

test('wirkung: Klo und Häufchen melden einen Gang', () => {
  assert.deepEqual(wirkung('klo', satt), { gang: true });
  assert.deepEqual(wirkung('haeufchen', satt), { gang: true });
});

test('wirkung: Sonnenbad (viertes Herz) bringt am Fenster dreimal so viel Laune', () => {
  assert.equal(wirkung('fenster', satt).laune * 3, wirkung('fenster', { ...satt, sonnenbad: true }).laune);
});

test('freie Zeit (2.3.0): sie putzt sich, streckt sich und gähnt – ohne dafür zu laufen', () => {
  const arten = new Set();
  for (let i = 0; i < 400; i += 1) arten.add(naechsteTaetigkeit(satt, () => (i % 97) / 97).art);
  for (const a of ['putzen', 'strecken', 'gaehnen']) assert.ok(arten.has(a), `${a} fehlt`);
  for (const a of ['putzen', 'strecken', 'gaehnen']) {
    let t;
    for (let i = 0; i < 97 && t?.art !== a; i += 1) t = naechsteTaetigkeit(satt, () => i / 97);
    assert.equal(t.ort, null, `${a} bleibt am Platz`);
  }
});

test('2.4.0: Regal, Katzengras und Ball nur, wenn sie im Zimmer sind', () => {
  const ohne = new Set();
  for (let i = 0; i < 200; i += 1) ohne.add(naechsteTaetigkeit(satt, () => i / 200).art);
  for (const a of ['regal', 'knabbern', 'ball']) assert.ok(!ohne.has(a), `${a} ohne Möbel`);

  const mit = { ...satt, moebel: new Set(['wandregal', 'katzengras', 'ball']), ball: { x: 700, y: 640 } };
  const arten = new Set();
  for (let i = 0; i < 200; i += 1) arten.add(naechsteTaetigkeit(mit, () => i / 200).art);
  for (const a of ['regal', 'knabbern', 'ball']) assert.ok(arten.has(a), `${a} fehlt`);
});

test('2.4.0: zum Ball läuft sie dorthin, wo er gerade liegt', () => {
  const mit = { ...satt, moebel: new Set(['ball']), ball: { x: 700, y: 640 } };
  let t;
  for (let i = 0; i < 200 && t?.art !== 'ball'; i += 1) t = naechsteTaetigkeit(mit, () => i / 200);
  assert.equal(t.ort.y, 640);
  assert.ok(Math.abs(t.ort.x - 700) <= 60, 'neben dem Ball');
});

test('2.4.0: Wirkung – Regal und Knabbern heben die Laune, der Ball rollt weg', () => {
  assert.ok(wirkung('regal', satt).laune > 0);
  assert.ok(wirkung('knabbern', satt).laune > 0);
  assert.equal(wirkung('ball', satt).ball, true);
  assert.ok(wirkung('ball', satt).laune > 0);
});
