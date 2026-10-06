import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCHICHTWECHSEL_STUNDE, datumFuerDruck, gueltigeWahl, schichtDatum, schichtSchluessel } from './schicht.js';

const am = (s) => new Date(s);   // Ortszeit, wie das Tablet sie hat

test('Schichttag: ab 5 Uhr zählt der Kalendertag', () => {
  assert.equal(SCHICHTWECHSEL_STUNDE, 5);
  assert.equal(schichtSchluessel(am('2026-10-07T05:00:00')), '2026-10-07');
  assert.equal(schichtSchluessel(am('2026-10-07T14:30:00')), '2026-10-07');
  assert.equal(schichtSchluessel(am('2026-10-07T23:59:00')), '2026-10-07');
});

test('Schichttag: vor 5 Uhr gehört die Nacht noch zum Vortag', () => {
  assert.equal(schichtSchluessel(am('2026-10-07T04:59:00')), '2026-10-06');
  assert.equal(schichtSchluessel(am('2026-10-07T00:10:00')), '2026-10-06');
  // Monats- und Jahreswechsel
  assert.equal(schichtSchluessel(am('2026-11-01T02:00:00')), '2026-10-31');
  assert.equal(schichtSchluessel(am('2027-01-01T03:00:00')), '2026-12-31');
});

test('Schichtdatum liegt mittags – Zeitumstellung kann den Tag nicht kippen', () => {
  const d = schichtDatum(am('2026-10-25T03:30:00'));   // Nacht der Umstellung
  assert.equal(d.getHours(), 12);
  assert.equal(schichtSchluessel(d), '2026-10-24');
});

/*
  Der eigentliche Fehler: das Datum wurde einmal beim Laden berechnet.
  Ein Tablet, das über Nacht anblieb, druckte morgens das Vortagsdatum.
*/
test('Druckdatum ohne eigene Wahl folgt immer der aktuellen Schicht', () => {
  assert.equal(schichtSchluessel(datumFuerDruck(null, am('2026-10-06T23:00:00'))), '2026-10-06');
  assert.equal(schichtSchluessel(datumFuerDruck(null, am('2026-10-07T05:01:00'))), '2026-10-07');
});

test('eine eigene Wahl gilt nur in der Schicht, in der sie getroffen wurde', () => {
  const wahl = { datum: am('2026-10-04T12:00:00'), schicht: '2026-10-06' };
  // gleiche Schicht, auch nach Mitternacht: die Wahl gilt
  assert.equal(schichtSchluessel(datumFuerDruck(wahl, am('2026-10-06T22:00:00'))), '2026-10-04');
  assert.equal(schichtSchluessel(datumFuerDruck(wahl, am('2026-10-07T03:00:00'))), '2026-10-04');
  // ab dem Schichtwechsel ist sie verfallen
  assert.equal(gueltigeWahl(wahl, am('2026-10-07T05:00:00')), null);
  assert.equal(schichtSchluessel(datumFuerDruck(wahl, am('2026-10-07T05:00:00'))), '2026-10-07');
});

test('kaputte Wahl wird ignoriert statt ein Unsinnsdatum zu drucken', () => {
  for (const kaputt of [{}, { datum: 'gestern', schicht: '2026-10-06' }, { datum: new Date('x'), schicht: '2026-10-06' }]) {
    assert.equal(gueltigeWahl(kaputt, am('2026-10-06T12:00:00')), null);
  }
});
