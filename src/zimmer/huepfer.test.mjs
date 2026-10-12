import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HINDERNISSE, HUEPFER, huepferLohn, huepferStart, meter, schritt } from './huepfer.js';

const fest = () => 0.5;
const laufen = (s, sekunden, tippen = () => false) => {
  let z = s;
  for (let i = 0; i < sekunden * 60; i += 1) z = schritt(z, 1 / 60, tippen(i, z), fest);
  return z;
};

test('Hüpfer: ein Sprung geht hoch genug für den Staubsauger und landet wieder', () => {
  let s = schritt(huepferStart(), 1 / 60, true, fest);
  let hoechste = 0;
  for (let i = 0; i < 90; i += 1) { s = schritt(s, 1 / 60, false, fest); hoechste = Math.max(hoechste, s.katze.y); }
  assert.ok(hoechste > HINDERNISSE.staubsauger.h + 20, `Sprunghöhe ${hoechste}`);
  assert.equal(s.katze.y, 0);
  assert.equal(s.katze.spruenge, 0);
});

test('Hüpfer: zweiter Sprung in der Luft, ein dritter nicht', () => {
  let s = schritt(huepferStart(), 1 / 60, true, fest);
  for (let i = 0; i < 10; i += 1) s = schritt(s, 1 / 60, false, fest);
  s = schritt(s, 1 / 60, true, fest);
  assert.equal(s.katze.spruenge, 2);
  const vy = s.katze.vy;
  s = schritt(s, 1 / 60, true, fest);
  assert.ok(s.katze.vy < vy, 'dritter Tipp wirkt nicht');
});

test('Hüpfer: ohne Springen stösst sie an die erste Gurke – vorbei', () => {
  const s = laufen(huepferStart(), 6);
  assert.equal(s.vorbei, true);
  assert.equal(s.hindernisse[0].art, 'gurke');
  // Danach ändert sich nichts mehr
  assert.equal(schritt(s, 1 / 60, true, fest), s);
});

test('Hüpfer: wer rechtzeitig springt, kommt weiter und wird schneller', () => {
  // Springen, sobald ein Hindernis nah genug ist
  const tippen = (_, z) => z.katze.y === 0 && z.hindernisse.some((o) => o.x - HUEPFER.katzeX > 0 && o.x - HUEPFER.katzeX < 120);
  const s = laufen(huepferStart(), 20, tippen);
  assert.equal(s.vorbei, false);
  assert.ok(meter(s) > 50, `${meter(s)} m`);
  assert.ok(s.tempo > HUEPFER.tempo);
});

test('Hüpfer: eine Münze auf ihrer Höhe wird eingesammelt', () => {
  const start = { ...huepferStart(), muenzen: [{ id: 1, x: HUEPFER.katzeX + 4, hoehe: HUEPFER.hoehe / 2 }] };
  const s = schritt(start, 1 / 60, false, fest);
  assert.equal(s.gesammelt, 1);
  assert.equal(s.muenzen.length, 0);
});

test('Hüpfer: Lohn aus Münzen und Strecke, gedeckelt', () => {
  assert.equal(huepferLohn({ gesammelt: 3, strecke: 100 * 60 }), 3 + 2);
  assert.equal(huepferLohn({ gesammelt: 99, strecke: 0 }), HUEPFER.lohnMax);
});

test('Hüpfer: ein grosser Ruckler wird gekappt', () => {
  const s = schritt(huepferStart(), 2, false, fest);
  assert.ok(s.strecke <= HUEPFER.tempoMax * 0.05 + 1);
});
