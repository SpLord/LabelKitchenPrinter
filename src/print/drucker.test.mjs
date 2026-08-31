import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ANZAHL, begrenzeAnzahl, druckParameter, druckerNamen, waehleDrucker } from './drucker.js';

test('drucker: Namen aus der Framework-Antwort', () => {
  assert.deepEqual(druckerNamen([{ name: 'A' }, { name: 'B' }]), ['A', 'B']);
  assert.deepEqual(druckerNamen(['A', 'B']), ['A', 'B']);
  assert.deepEqual(druckerNamen([{ name: '' }, { }, null, { name: 'C' }]), ['C']);
  assert.deepEqual(druckerNamen(null), []);
  assert.deepEqual(druckerNamen('quatsch'), []);
});

test('drucker: gemerkte Wahl gewinnt, solange sie da ist', () => {
  assert.equal(waehleDrucker(['Küche', 'Bar'], 'Bar'), 'Bar');
  assert.equal(waehleDrucker(['Küche', 'Bar'], 'Weg'), 'Küche', 'nicht mehr angeschlossen → erster');
  assert.equal(waehleDrucker(['Küche'], null), 'Küche');
  assert.equal(waehleDrucker([], 'Bar'), null);
});

test('anzahl: wird auf 1..20 begrenzt', () => {
  assert.equal(begrenzeAnzahl(5), 5);
  assert.equal(begrenzeAnzahl(0), 1);
  assert.equal(begrenzeAnzahl(-3), 1);
  assert.equal(begrenzeAnzahl(999), MAX_ANZAHL);
  assert.equal(begrenzeAnzahl('7'), 7);
  assert.equal(begrenzeAnzahl('quatsch'), 1);
  assert.equal(begrenzeAnzahl(3.6), 4);
});

test('druckParameter: eine Kopie braucht nichts Besonderes', () => {
  assert.deepEqual(druckParameter({}, 1), { xml: null, wiederholungen: 1 });
});

test('druckParameter: nutzt das Framework, wenn es Kopien kann', () => {
  const fw = { createLabelWriterPrintParamsXml: ({ copies }) => `<params copies="${copies}"/>` };
  assert.deepEqual(druckParameter(fw, 4), { xml: '<params copies="4"/>', wiederholungen: 1 });
});

test('druckParameter: fällt auf mehrfaches Drucken zurück', () => {
  assert.deepEqual(druckParameter({}, 4), { xml: null, wiederholungen: 4 });
  const kaputt = { createLabelWriterPrintParamsXml: () => { throw new Error('alt'); } };
  assert.deepEqual(druckParameter(kaputt, 3), { xml: null, wiederholungen: 3 });
});

test('druckParameter: begrenzt auch hier', () => {
  assert.equal(druckParameter({}, 500).wiederholungen, MAX_ANZAHL);
});
