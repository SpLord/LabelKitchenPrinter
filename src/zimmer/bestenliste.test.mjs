import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAETZE, eintragen, kommtRein, listeLesen, namePutzen, rekord, umbenennen } from './bestenliste.js';

const e = (wert, name = 'A', datum = wert) => ({ id: `${name}-${wert}`, name, wert, datum });

test('Bestenliste: leer nimmt alles über 0, Rekord steht oben', () => {
  assert.equal(kommtRein([], 0), false);
  let r = eintragen([], e(50));
  assert.equal(r.platz, 1);
  r = eintragen(r.liste, e(80, 'B'));
  assert.equal(r.platz, 1);
  assert.equal(rekord(r.liste), 80);
  r = eintragen(r.liste, e(60, 'C'));
  assert.equal(r.platz, 2);
});

test('Bestenliste: nur die fünf besten bleiben, zu wenig kommt nicht rein', () => {
  let liste = [];
  for (const w of [10, 20, 30, 40, 50]) liste = eintragen(liste, e(w)).liste;
  assert.equal(liste.length, PLAETZE);
  assert.equal(kommtRein(liste, 10), false, 'Gleichstand mit dem Letzten reicht nicht');
  assert.deepEqual(eintragen(liste, e(5)), { liste, platz: null });
  const r = eintragen(liste, e(35, 'Neu'));
  assert.equal(r.platz, 3);
  assert.deepEqual(r.liste.map((x) => x.wert), [50, 40, 35, 30, 20]);
});

test('Bestenliste: Namen säubern und nachträglich ändern', () => {
  assert.equal(namePutzen('  Miles   der  Koch  '), 'Miles der Koch');
  assert.equal(namePutzen(''), 'Ich');
  assert.equal(namePutzen('x'.repeat(40)).length, 14);
  const liste = [e(50, 'A'), e(40, 'B')];
  assert.equal(umbenennen(liste, 'B-40', 'Carla')[1].name, 'Carla');
});

test('Bestenliste: kaputter Speicher ergibt eine leere Liste, Fremdes wird aussortiert', () => {
  assert.deepEqual(listeLesen('kaputt'), []);
  assert.deepEqual(listeLesen('{"a":1}'), []);
  const l = listeLesen(JSON.stringify([{ name: 'A', wert: 5, datum: 1 }, { name: 'B', wert: -3 }, null, { name: 'C', wert: 9, datum: 2 }]));
  assert.deepEqual(l.map((x) => x.wert), [9, 5]);
});
