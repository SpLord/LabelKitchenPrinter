import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KLO, leer, lesen, faellig, gang, nachholen, kloLeeren, haeufchenWeg,
} from './klo.js';

const STUNDE = 3_600_000;
const T0 = Date.UTC(2026, 9, 6, 8);
const fest = () => 0.5;

test('faellig: erst nach dem Abstand', () => {
  const z = leer(T0);
  assert.equal(faellig(z, T0 + KLO.abstand - 1), false);
  assert.equal(faellig(z, T0 + KLO.abstand), true);
});

test('gang mit Klo: landet im Klo, kein Häufchen', () => {
  const z = gang(leer(T0), { hatKlo: true, jetzt: T0 + 5 * STUNDE, zufall: fest });
  assert.equal(z.klo, 1);
  assert.equal(z.haeufchen.length, 0);
  assert.equal(z.letzterGang, T0 + 5 * STUNDE);
});

test('gang ohne Klo: Häufchen an ihrer Stelle', () => {
  const z = gang(leer(T0), { hatKlo: false, jetzt: T0 + STUNDE, ort: { x: 760, y: 640 }, zufall: fest });
  assert.equal(z.klo, 0);
  assert.equal(z.haeufchen.length, 1);
  assert.deepEqual([z.haeufchen[0].x, z.haeufchen[0].y], [760, 640]);
});

test('gang: volles Klo → Häufchen daneben auf dem Boden', () => {
  const voll = { ...leer(T0), klo: KLO.kapazitaet };
  const z = gang(voll, { hatKlo: true, jetzt: T0 + STUNDE, zufall: fest });
  assert.equal(z.klo, KLO.kapazitaet);
  assert.equal(z.haeufchen.length, 1);
});

test('gang: nie mehr als maxHaeufchen auf dem Boden', () => {
  let z = leer(T0);
  for (let i = 0; i < KLO.maxHaeufchen + 3; i += 1) z = gang(z, { hatKlo: false, jetzt: T0 + i, zufall: Math.random });
  assert.equal(z.haeufchen.length, KLO.maxHaeufchen);
});

test('gang verändert den alten Zustand nicht', () => {
  const alt = leer(T0);
  gang(alt, { hatKlo: true, jetzt: T0 + STUNDE, zufall: fest });
  assert.equal(alt.klo, 0);
});

test('nachholen: verpasste Gänge landen im Klo, solange es Platz hat', () => {
  // 13 h weg: Gänge nach 4, 8, 12 h (jeweils plus Gnadenfrist) → 3
  const z = nachholen(leer(T0), { hatKlo: true, jetzt: T0 + 13 * STUNDE, zufall: fest });
  assert.equal(z.klo, 3);
  assert.equal(z.haeufchen.length, 0);
  assert.equal(z.letzterGang, T0 + 3 * KLO.abstand);
});

test('nachholen: ohne Klo liegen die Häufchen herum', () => {
  const z = nachholen(leer(T0), { hatKlo: false, jetzt: T0 + 9 * STUNDE, zufall: fest });
  assert.equal(z.haeufchen.length, 2);
});

test('nachholen: in der Gnadenfrist noch nichts – die Katze darf selbst gehen', () => {
  const z = nachholen(leer(T0), { hatKlo: true, jetzt: T0 + KLO.abstand + KLO.gnade - 1, zufall: fest });
  assert.equal(z.klo, 0);
  assert.equal(z.letzterGang, T0);
});

test('nachholen: nach Wochen Abwesenheit begrenzt, Uhr springt auf jetzt', () => {
  const jetzt = T0 + 21 * 24 * STUNDE;
  const z = nachholen(leer(T0), { hatKlo: false, jetzt, zufall: Math.random });
  assert.equal(z.haeufchen.length, KLO.maxHaeufchen);
  assert.ok(jetzt - z.letzterGang < KLO.abstand + KLO.gnade);
});

test('kloLeeren: 3 Münzen, Klo wieder leer', () => {
  const { zustand, lohn } = kloLeeren({ ...leer(T0), klo: 2 }, '2026-10-06');
  assert.equal(lohn, KLO.lohnKlo);
  assert.equal(zustand.klo, 0);
});

test('kloLeeren: leeres Klo bringt nichts', () => {
  assert.equal(kloLeeren(leer(T0), '2026-10-06').lohn, 0);
});

test('haeufchenWeg: 2 Münzen, das richtige verschwindet', () => {
  let z = leer(T0);
  z = gang(z, { hatKlo: false, jetzt: T0 + 1, ort: { x: 300, y: 600 }, zufall: fest });
  z = gang(z, { hatKlo: false, jetzt: T0 + 2, ort: { x: 700, y: 650 }, zufall: fest });
  const weg = z.haeufchen[0].id;
  const { zustand, lohn } = haeufchenWeg(z, weg, '2026-10-06');
  assert.equal(lohn, KLO.lohnHaeufchen);
  assert.equal(zustand.haeufchen.length, 1);
  assert.notEqual(zustand.haeufchen[0].id, weg);
});

test('haeufchenWeg: unbekannte Kennung ändert nichts', () => {
  const z = leer(T0);
  assert.deepEqual(haeufchenWeg(z, 'gibt-es-nicht', '2026-10-06'), { zustand: z, lohn: 0 });
});

test('Putzlohn: höchstens tagesGrenze am Tag, am nächsten Tag wieder', () => {
  let z = { ...leer(T0), putzen: { tag: '2026-10-06', summe: KLO.tagesGrenze - 1 } };
  const a = kloLeeren({ ...z, klo: 1 }, '2026-10-06');
  assert.equal(a.lohn, 1);
  assert.equal(a.zustand.putzen.summe, KLO.tagesGrenze);
  const b = kloLeeren({ ...a.zustand, klo: 1 }, '2026-10-06');
  assert.equal(b.lohn, 0);
  assert.equal(b.zustand.klo, 0, 'leeren geht trotzdem');
  const c = kloLeeren({ ...b.zustand, klo: 1 }, '2026-10-07');
  assert.equal(c.lohn, KLO.lohnKlo);
});

test('lesen: kaputte oder fremde Daten → frischer Zustand', () => {
  assert.deepEqual(lesen('{kaputt', T0), leer(T0));
  assert.deepEqual(lesen(null, T0), leer(T0));
  const z = lesen(JSON.stringify({ letzterGang: T0 - 5, klo: 99, haeufchen: [{ id: 'a', x: 1, y: 2 }, 'mist'] }), T0);
  assert.equal(z.klo, KLO.kapazitaet);
  assert.equal(z.haeufchen.length, 1);
  assert.equal(z.letzterGang, T0 - 5);
});

test('gang: Häufchen landen mit Abstand zueinander – jedes bleibt antippbar', () => {
  let z = leer(T0);
  for (let i = 0; i < KLO.maxHaeufchen; i += 1) {
    z = gang(z, { hatKlo: false, jetzt: T0 + i, ort: { x: 400, y: 640 }, zufall: fest });
  }
  for (const a of z.haeufchen) {
    for (const b of z.haeufchen) {
      if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= KLO.abstandHaeufchen, `${a.id}/${b.id} zu nah`);
    }
  }
});

test('gang: Häufchen landen nie hinter der Menüleiste (unterer Rand der Szene)', () => {
  let z = leer(T0);
  z = gang(z, { hatKlo: false, jetzt: T0, ort: { x: 500, y: 690 }, zufall: fest });
  z = gang(z, { hatKlo: false, jetzt: T0 + 1, zufall: () => 0.999 });
  for (const h of z.haeufchen) assert.ok(h.y <= KLO.bodenUnten, `y=${h.y}`);
});

test('gang: nie direkt neben Napf oder Wasser – sie macht nicht neben ihr Futter', () => {
  let z = leer(T0);
  for (let i = 0; i < KLO.maxHaeufchen; i += 1) {
    z = gang(z, { hatKlo: false, jetzt: T0 + i, ort: { x: 480, y: 600 }, zufall: Math.random });
  }
  for (const h of z.haeufchen) {
    for (const m of KLO.meiden) assert.ok(Math.hypot(h.x - m.x, h.y - m.y) >= KLO.abstandMoebel, `${h.x}/${h.y} zu nah an ${m.x}/${m.y}`);
  }
});
