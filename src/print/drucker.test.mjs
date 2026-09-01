import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ANZAHL, begrenzeAnzahl, druckParameter, drucke, druckerNamen, waehleDrucker } from './drucker.js';

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
  // So sieht es im echten Framework aus: <LabelWriterPrintParams><Copies>N</Copies>
  const fw = { createLabelWriterPrintParamsXml: ({ copies }) =>
    `<LabelWriterPrintParams><Copies>${copies}</Copies></LabelWriterPrintParams>` };
  assert.deepEqual(druckParameter(fw, 4), {
    xml: '<LabelWriterPrintParams><Copies>4</Copies></LabelWriterPrintParams>', wiederholungen: 1 });
});

test('druckParameter: fällt auf mehrfaches Drucken zurück', () => {
  assert.deepEqual(druckParameter({}, 4), { xml: null, wiederholungen: 4 });
  const kaputt = { createLabelWriterPrintParamsXml: () => { throw new Error('alt'); } };
  assert.deepEqual(druckParameter(kaputt, 3), { xml: null, wiederholungen: 3 });
});

test('druckParameter: begrenzt auch hier', () => {
  assert.equal(druckParameter({}, 500).wiederholungen, MAX_ANZAHL);
});

test('drucke: ein Exemplar ohne Parameter', () => {
  const rufe = [];
  const label = { print: (ziel, params) => rufe.push({ ziel, params: params ?? null }) };
  const r = drucke(label, 'D', {}, 1);
  assert.deepEqual(r, { gedruckt: 1, offen: 0, rueckfall: false, grund: null });
  assert.deepEqual(rufe, [{ ziel: 'D', params: null }]);
});

test('drucke: mehrere über den Kopien-Parameter', () => {
  const rufe = [];
  const label = { print: (ziel, params) => rufe.push({ ziel, params: params ?? null }) };
  const fw = { createLabelWriterPrintParamsXml: ({ copies }) => `<x><Copies>${copies}</Copies></x>` };
  const r = drucke(label, 'D', fw, 4);
  assert.equal(r.gedruckt, 4);
  assert.equal(r.rueckfall, false);
  assert.equal(rufe.length, 1, 'ein Aufruf genügt');
  assert.match(rufe[0].params, /<Copies>4<\/Copies>/);
});

test('drucke: wirft der Kopien-Weg, wird einzeln gedruckt statt gar nicht', () => {
  const rufe = [];
  const label = {
    print: (ziel, params) => {
      // Der Dienst nimmt den Parameter nicht an
      if (params) throw new Error('printParams abgelehnt');
      rufe.push(ziel);
    },
  };
  const fw = { createLabelWriterPrintParamsXml: ({ copies }) => `<x><Copies>${copies}</Copies></x>` };
  const r = drucke(label, 'D', fw, 3);
  assert.equal(r.gedruckt, 3, 'die Etiketten kommen trotzdem heraus');
  assert.equal(r.rueckfall, true);
  assert.match(r.grund, /abgelehnt/);
  assert.deepEqual(rufe, ['D', 'D', 'D']);
});

test('drucke: unbrauchbarer Parameter-Rückgabewert wird verworfen', () => {
  const rufe = [];
  const label = { print: (ziel, params) => rufe.push(params ?? null) };
  for (const kaputt of [() => '', () => null, () => '<x/>', () => { throw new Error('x'); }]) {
    rufe.length = 0;
    const r = drucke(label, 'D', { createLabelWriterPrintParamsXml: kaputt }, 3);
    assert.equal(r.gedruckt, 3);
    assert.deepEqual(rufe, [null, null, null], 'einzeln, ohne Parameter');
  }
});

test('drucke: Anzahl wird auch hier begrenzt', () => {
  let n = 0;
  const label = { print: () => { n += 1; } };
  drucke(label, 'D', {}, 999);
  assert.equal(n, MAX_ANZAHL);
});

/*
  Der wunde Punkt beim Mehrfachdruck: bricht der Dienst nach ein paar
  Etiketten ab, sind die ersten schon aus dem Gerät gelaufen. Wer nur
  "Fehler beim Drucken" liest, druckt alles noch einmal – und hat die
  Hälfte doppelt.
*/
test('drucke: Abbruch mitten in der Serie meldet, was schon heraus ist', () => {
  let n = 0;
  const label = {
    print: () => {
      n += 1;
      if (n === 4) throw new Error('Print job failed');
    },
  };
  const r = drucke(label, 'D', {}, 6);
  assert.equal(r.gedruckt, 3, 'drei sind wirklich gedruckt');
  assert.equal(r.offen, 3, 'drei fehlen noch');
  assert.match(r.grund, /Print job failed/);
});

test('drucke: nach einem Abbruch wird nicht weiter gehämmert', () => {
  let versuche = 0;
  const label = { print: () => { versuche += 1; throw new Error('offline'); } };
  const r = drucke(label, 'D', {}, 20);
  assert.equal(versuche, 1, 'ein Fehlversuch genügt als Antwort');
  assert.equal(r.gedruckt, 0);
  assert.equal(r.offen, 20);
});

test('drucke: heiler Lauf meldet nichts Offenes', () => {
  const label = { print: () => {} };
  assert.equal(drucke(label, 'D', {}, 3).offen, 0);
  const fw = { createLabelWriterPrintParamsXml: ({ copies }) => `<x><Copies>${copies}</Copies></x>` };
  assert.equal(drucke(label, 'D', fw, 3).offen, 0);
});
