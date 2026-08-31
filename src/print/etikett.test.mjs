import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_TAGE, datumsText, putzeTage, verwendbarBis } from './etikett.js';

const am = (s) => new Date(`${s}T12:00:00`);

test('etikett: Tagesangabe säubern', () => {
  assert.equal(putzeTage(3), 3);
  assert.equal(putzeTage('5'), 5);
  assert.equal(putzeTage(2.6), 3);
  assert.equal(putzeTage(''), null);
  assert.equal(putzeTage(null), null);
  assert.equal(putzeTage(undefined), null);
  assert.equal(putzeTage(0), null);
  assert.equal(putzeTage(-4), null);
  assert.equal(putzeTage('quatsch'), null);
  assert.equal(putzeTage(9999), MAX_TAGE);
});

test('etikett: Verbrauchsdatum rechnen', () => {
  assert.equal(verwendbarBis(am('2026-08-31'), 3).toDateString(), am('2026-09-03').toDateString());
  assert.equal(verwendbarBis(am('2026-08-31'), 1).toDateString(), am('2026-09-01').toDateString());
  assert.equal(verwendbarBis(am('2026-12-30'), 5).toDateString(), am('2027-01-04').toDateString(), 'über den Jahreswechsel');
  assert.equal(verwendbarBis(am('2026-02-27'), 2).toDateString(), am('2026-03-01').toDateString(), 'über das Monatsende');
});

test('etikett: ohne Haltbarkeit gibt es kein Verbrauchsdatum', () => {
  assert.equal(verwendbarBis(am('2026-08-31'), null), null);
  assert.equal(verwendbarBis(am('2026-08-31'), 0), null);
  assert.equal(verwendbarBis(new Date('kaputt'), 3), null);
});

test('etikett: ohne Haltbarkeit bleibt das Etikett wie bisher', () => {
  assert.equal(datumsText(am('2026-08-31'), null), '31.8.2026');
  assert.equal(datumsText(am('2026-08-31'), ''), '31.8.2026');
});

test('etikett: mit Haltbarkeit stehen beide Daten kurz nebeneinander', () => {
  assert.equal(datumsText(am('2026-08-31'), 3), '31.08. → 03.09.');
  assert.equal(datumsText(am('2026-01-05'), 10), '05.01. → 15.01.');
});

test('etikett: der Text bleibt kurz genug fürs Feld', () => {
  // Das Datumsfeld ist 1,23 Zoll breit; alles über rund 16 Zeichen schrumpft
  // spürbar. Der lange Fall ist das Maximum, das entstehen kann.
  const lang = datumsText(am('2026-12-31'), MAX_TAGE);
  assert.ok(lang.length <= 16, `zu lang: ${lang} (${lang.length})`);
});
