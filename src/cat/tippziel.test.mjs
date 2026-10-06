import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tippziel, istEingabefeld } from './tippziel.js';

/*
  Attrappe eines DOM-Elements: nur das, was tippziel braucht. `kette` sind
  die Selektoren, auf die das Element selbst oder ein Vorfahre passt.
*/
const el = (name, kette = [], tag = 'div') => ({
  name,
  tagName: tag.toUpperCase(),
  closest(sel) {
    const treffer = sel.split(',').map((s) => s.trim()).find((s) => kette.includes(s));
    return treffer ? this : null;
  },
});
const katze = (name = 'katze') => el(name, ['.cat-sprite']);

test('tippziel: leerer Stapel ergibt kein Ziel', () => {
  assert.equal(tippziel([]), null);
  assert.equal(tippziel(undefined), null);
});

test('tippziel: nur die Katze unter dem Finger – streicheln', () => {
  assert.equal(tippziel([katze(), katze('schatten')]), null);
});

test('tippziel: Knopf hinter der Katze wird zum Ziel', () => {
  const knopf = el('etikett', ['button'], 'button');
  assert.equal(tippziel([katze(), katze('schatten'), knopf, el('body')]), knopf);
});

test('tippziel: Knopf VOR der Katze liefert ebenfalls den Knopf', () => {
  const knopf = el('etikett', ['button'], 'button');
  assert.equal(tippziel([knopf, katze()]), knopf);
});

test('tippziel: freie Fläche hinter der Katze – streicheln', () => {
  assert.equal(tippziel([katze(), el('flaeche'), el('body')]), null);
});

test('tippziel: nur das oberste Element hinter der Katze zählt', () => {
  const knopf = el('etikett', ['button'], 'button');
  assert.equal(tippziel([katze(), el('deckel'), knopf]), null);
});

test('tippziel: Beschriftung im Knopf führt zum Knopf', () => {
  const knopf = el('knopf', ['button'], 'button');
  const span = { ...el('text'), closest: (sel) => (sel.includes('button') ? knopf : null) };
  assert.equal(tippziel([katze(), span]), knopf);
});

test('tippziel: Links, Felder, Rollen und Datepicker zählen als Bedienelemente', () => {
  for (const sel of ['a', 'input', 'select', 'textarea', 'label', '[role=button]']) {
    const ziel = el('x', [sel]);
    assert.equal(tippziel([katze(), ziel]), ziel, sel);
  }
  const tag = el('tag', ['.react-datepicker']);
  assert.equal(tippziel([katze(), tag]), tag);
});

test('istEingabefeld: Felder bekommen Fokus statt Klick', () => {
  assert.equal(istEingabefeld(el('a', [], 'input')), true);
  assert.equal(istEingabefeld(el('a', [], 'textarea')), true);
  assert.equal(istEingabefeld(el('a', [], 'select')), true);
  assert.equal(istEingabefeld(el('a', [], 'button')), false);
  assert.equal(istEingabefeld(null), false);
});
