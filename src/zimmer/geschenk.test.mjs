import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GESCHENK, PFLEGE, betrag, geschenkDa, abholen, pflegen, pflegeLesen, selbstheilung, HEILUNG,
} from './geschenk.js';

const TAG = (d, h = 12) => new Date(2026, 9, d, h);

test('betrag: 10 Grundstock + Pflege vom Vortag + 4 je Herz', () => {
  assert.equal(betrag({ pflegeVortag: 0, herzen: 0 }), 10);
  assert.equal(betrag({ pflegeVortag: 20, herzen: 0 }), 30);
  assert.equal(betrag({ pflegeVortag: 12, herzen: 3 }), 10 + 12 + 12);
});

test('betrag: Pflege zählt höchstens 20', () => {
  assert.equal(betrag({ pflegeVortag: 99, herzen: 0 }), 30);
});

test('betrag: Glückspfote +25 %, gerundet', () => {
  assert.equal(betrag({ pflegeVortag: 0, herzen: 0, glueckspfote: true }), 13);
  assert.equal(betrag({ pflegeVortag: 20, herzen: 5, glueckspfote: true }), Math.round(50 * 1.25));
});

test('geschenkDa: einmal je Schichttag, der Tag beginnt um 5 Uhr', () => {
  assert.equal(geschenkDa(null, TAG(6, 12)), true);
  assert.equal(geschenkDa('2026-10-06', TAG(6, 12)), false);
  // 3 Uhr nachts gehört noch zum Vortag
  assert.equal(geschenkDa('2026-10-06', TAG(7, 3)), false);
  assert.equal(geschenkDa('2026-10-06', TAG(7, 5)), true);
});

test('abholen: liefert Betrag und merkt sich den Schichttag', () => {
  const pflege = { tag: '2026-10-05', punkte: 8 };
  const r = abholen({ abgeholt: null, pflege, herzen: 1, glueckspfote: false }, TAG(6, 9));
  assert.equal(r.muenzen, 10 + 8 + 4);
  assert.equal(r.abgeholt, '2026-10-06');
});

test('abholen: Pflege von vorgestern zählt nicht mehr', () => {
  const r = abholen({ abgeholt: null, pflege: { tag: '2026-10-04', punkte: 20 }, herzen: 0 }, TAG(6, 9));
  assert.equal(r.muenzen, 10);
});

test('abholen: schon abgeholt → nichts', () => {
  const r = abholen({ abgeholt: '2026-10-06', pflege: { tag: '2026-10-05', punkte: 20 }, herzen: 2 }, TAG(6, 9));
  assert.equal(r.muenzen, 0);
});

test('pflegen: sammelt Punkte je Schichttag, gedeckelt', () => {
  let p = pflegen(null, 'fuettern', TAG(6, 9));
  assert.deepEqual(p, { tag: '2026-10-06', punkte: PFLEGE.fuettern, vortag: null });
  for (let i = 0; i < 20; i += 1) p = pflegen(p, 'spielen', TAG(6, 10));
  assert.equal(p.punkte, GESCHENK.pflegeMax);
});

test('pflegen: neuer Tag – der alte wird zum Vortag', () => {
  const gestern = { tag: '2026-10-05', punkte: 14, vortag: null };
  const p = pflegen(gestern, 'putzen', TAG(6, 9));
  assert.equal(p.punkte, PFLEGE.putzen);
  assert.deepEqual(p.vortag, { tag: '2026-10-05', punkte: 14 });
});

test('abholen: findet die Pflege des Vortags auch, wenn heute schon gepflegt wurde', () => {
  const pflege = pflegen({ tag: '2026-10-05', punkte: 14, vortag: null }, 'putzen', TAG(6, 9));
  assert.equal(abholen({ abgeholt: null, pflege, herzen: 0 }, TAG(6, 10)).muenzen, 24);
});

test('pflegen: unbekannte Tätigkeit zählt nichts', () => {
  assert.equal(pflegen(null, 'quatsch', TAG(6)).punkte, 0);
});

test('pflegeLesen: Unsinn → leer', () => {
  assert.equal(pflegeLesen('{kaputt'), null);
  assert.equal(pflegeLesen(JSON.stringify({ tag: 5 })), null);
  assert.deepEqual(pflegeLesen(JSON.stringify({ tag: '2026-10-06', punkte: 7 })), { tag: '2026-10-06', punkte: 7, vortag: null });
});

const STUNDE = 3_600_000;
const T = Date.UTC(2026, 9, 6, 8);

test('selbstheilung: gut versorgt beginnt die Uhr', () => {
  assert.deepEqual(selbstheilung({ krank: true, hunger: 60, durst: 60, gutSeit: null }, T), { gutSeit: T, heilt: false });
});

test('selbstheilung: nach 12 h gutem Zustand heilt sie von selbst', () => {
  const r = selbstheilung({ krank: true, hunger: 60, durst: 60, gutSeit: T }, T + HEILUNG.dauer);
  assert.equal(r.heilt, true);
  assert.equal(r.gutSeit, null);
});

test('selbstheilung: Hunger oder Durst unter der Schwelle setzt die Uhr zurück', () => {
  assert.deepEqual(selbstheilung({ krank: true, hunger: 20, durst: 60, gutSeit: T }, T + STUNDE), { gutSeit: null, heilt: false });
});

test('selbstheilung: gesund → keine Uhr', () => {
  assert.deepEqual(selbstheilung({ krank: false, hunger: 60, durst: 60, gutSeit: T }, T + STUNDE), { gutSeit: null, heilt: false });
});
