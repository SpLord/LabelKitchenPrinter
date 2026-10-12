import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANGELN, FISCHE, angelLohn, angelSchritt, angelStart, neuerFisch, spitze } from './angeln.js';

const zufallAus = (saat) => { let x = saat; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
const ohneFische = (s) => ({ ...s, fische: [] });
const bis = (s, bedingung, max = 2000) => {
  let z = s;
  for (let i = 0; i < max && !bedingung(z); i += 1) z = angelSchritt(z, 1 / 60, false, zufallAus(i + 1));
  return z;
};

test('Angeln: der Haken pendelt hin und her, nie weiter als erlaubt', () => {
  let s = ohneFische(angelStart(zufallAus(1)));
  let min = 0; let max = 0;
  for (let i = 0; i < 400; i += 1) { s = angelSchritt(s, 1 / 60, false, zufallAus(2)); min = Math.min(min, s.winkel); max = Math.max(max, s.winkel); }
  assert.ok(max > 50 && min < -50, `${min} … ${max}`);
  assert.ok(Math.abs(max) <= ANGELN.pendelMax + 0.001);
  assert.equal(s.zustand, 'pendelt');
});

test('Angeln: ohne Fisch fliegt der Haken bis zum Rand und kommt leer zurück', () => {
  let s = angelSchritt(ohneFische(angelStart(zufallAus(1))), 1 / 60, true);
  assert.equal(s.zustand, 'raus');
  s = bis(s, (z) => z.zustand === 'zurueck');
  assert.equal(s.zustand, 'zurueck');
  s = { ...s, fische: [] };
  s = bis(s, (z) => z.zustand === 'pendelt');
  assert.equal(s.punkte, 0);
  assert.equal(s.laenge, ANGELN.ruhe);
});

test('Angeln: ein Fisch genau unter dem Haken wird gefangen und bringt seinen Wert', () => {
  const unten = { id: 99, art: 'gross', x: ANGELN.ursprung.x, y: 500, vx: 0 };
  let s = { ...angelStart(zufallAus(1)), fische: [unten] };
  s = angelSchritt(s, 1 / 60, true);   // winkel ≈ 0 beim Start
  s = bis(s, (z) => z.zustand === 'zieht');
  assert.equal(s.fang.art, 'gross');
  s = bis(s, (z) => z.zustand === 'pendelt');
  assert.equal(s.punkte, FISCHE.gross.wert);
  assert.deepEqual(s.gefangen, ['gross']);
});

test('Angeln: schwere Fänge ziehen sich langsamer hoch', () => {
  const ziehZeit = (art) => {
    let s = { ...angelStart(zufallAus(1)), fische: [], zustand: 'zieht', laenge: 400, fang: { id: 1, art, x: 0, y: 0, vx: 0 } };
    let n = 0;
    while (s.zustand === 'zieht' && n < 5000) { s = angelSchritt({ ...s, fische: [] }, 1 / 60, false, zufallAus(n + 3)); n += 1; }
    return n;
  };
  assert.ok(ziehZeit('gross') > ziehZeit('klein') * 2);
});

test('Angeln: Fische tauchen am Rand auf und schwimmen hinein', () => {
  for (const w of [0.1, 0.7]) {
    const f = neuerFisch(1, () => w);
    if (f.vx > 0) assert.ok(f.x < ANGELN.wasser.links, 'nach rechts: kommt von links aussen');
    else assert.ok(f.x > ANGELN.wasser.rechts, 'nach links: kommt von rechts aussen');
    assert.ok(f.y > ANGELN.wasser.oben && f.y < ANGELN.wasser.unten);
  }
});

test('Angeln: nach Ablauf der Zeit ist Schluss, ein Fang unterwegs zählt noch', () => {
  let s = { ...angelStart(zufallAus(1)), fische: [], zeit: ANGELN.dauer / 1000, zustand: 'zieht', laenge: 120, fang: { id: 1, art: 'klein', x: 0, y: 0, vx: 0 } };
  s = angelSchritt(s, 1 / 60, false, zufallAus(4));
  assert.equal(s.vorbei, false, 'erst hochziehen');
  s = bis({ ...s, fische: [] }, (z) => z.vorbei);
  assert.equal(s.vorbei, true);
  assert.equal(s.punkte, 1);
});

test('Angeln: Spitze der Schnur nach Winkel und Länge', () => {
  const p = spitze({ winkel: 0, laenge: 100 });
  assert.equal(Math.round(p.x), ANGELN.ursprung.x);
  assert.equal(Math.round(p.y), ANGELN.ursprung.y + 100);
});

test('Angeln: Lohn halbe Punkte aufgerundet, höchstens 15', () => {
  assert.equal(angelLohn(0), 0);
  assert.equal(angelLohn(5), 3);
  assert.equal(angelLohn(100), ANGELN.lohnMax);
});
