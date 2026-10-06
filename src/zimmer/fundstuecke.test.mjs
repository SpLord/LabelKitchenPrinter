import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FUNDSTUECKE, FUND, fundPruefen, einsammeln, fundLesen } from './fundstuecke.js';

const T = (d = 6, h = 12) => new Date(2026, 9, d, h);

test('FUNDSTUECKE: Kennungen eindeutig, jedes mit Namen', () => {
  assert.equal(new Set(FUNDSTUECKE.map((f) => f.id)).size, FUNDSTUECKE.length);
  assert.ok(FUNDSTUECKE.length >= 8);
  assert.ok(FUNDSTUECKE.every((f) => f.name && f.text));
});

test('fundPruefen: ohne fünftes Herz nie', () => {
  assert.equal(fundPruefen(null, { frei: false }, T(), () => 0).offen, null);
});

test('fundPruefen: einmal je Schichttag gewürfelt – Glück → ein Fundstück liegt da', () => {
  const r = fundPruefen(null, { frei: true }, T(), () => 0);
  assert.ok(r.offen);
  assert.equal(r.gewuerfelt, '2026-10-06');
  // am selben Tag nicht noch einmal
  const nochmal = fundPruefen({ ...r, offen: null }, { frei: true }, T(6, 18), () => 0);
  assert.equal(nochmal.offen, null);
});

test('fundPruefen: Pech → heute nichts, morgen neue Chance', () => {
  const pech = fundPruefen(null, { frei: true }, T(), () => 0.99);
  assert.equal(pech.offen, null);
  const morgen = fundPruefen(pech, { frei: true }, T(7, 9), () => 0);
  assert.ok(morgen.offen);
});

test('fundPruefen: bevorzugt, was noch fehlt', () => {
  const fast = FUNDSTUECKE.slice(1).map((f) => f.id);
  const r = fundPruefen({ gewuerfelt: null, gefunden: fast, offen: null }, { frei: true }, T(), () => 0);
  assert.equal(r.offen, FUNDSTUECKE[0].id);
});

test('einsammeln: ins Album, Lohn, und weg vom Boden', () => {
  const r = einsammeln({ gewuerfelt: '2026-10-06', gefunden: [], offen: 'murmel' });
  assert.deepEqual(r.stand.gefunden, ['murmel']);
  assert.equal(r.stand.offen, null);
  assert.equal(r.lohn, FUND.lohn);
  assert.equal(r.neu, true);
  const doppelt = einsammeln({ gewuerfelt: '2026-10-07', gefunden: ['murmel'], offen: 'murmel' });
  assert.equal(doppelt.neu, false);
  assert.deepEqual(doppelt.stand.gefunden, ['murmel']);
});

test('einsammeln: nichts offen → nichts', () => {
  assert.equal(einsammeln({ gewuerfelt: null, gefunden: [], offen: null }).lohn, 0);
});

test('fundLesen: Fremdes wird verworfen', () => {
  assert.deepEqual(fundLesen('{kaputt'), { gewuerfelt: null, gefunden: [], offen: null });
  assert.deepEqual(fundLesen(JSON.stringify({ gefunden: ['murmel', 'quatsch', 'murmel'], offen: 'quatsch' })),
    { gewuerfelt: null, gefunden: ['murmel'], offen: null });
});
