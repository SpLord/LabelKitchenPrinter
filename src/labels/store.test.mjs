import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from './store.js';
import { DEFAULT_GROUPS } from './defaults.js';

const t = test;

const base = DEFAULT_GROUPS;
const fleisch = base[0].id;

t('store: addEntry mutiert das Original nicht', () => {
  const before = JSON.stringify(base);
  const next = S.addEntry(base, fleisch, 'Lammkarree');
  assert.equal(JSON.stringify(base), before, 'Original wurde verändert!');
  assert.ok(next[0].entries.includes('Lammkarree'));
  assert.equal(next[0].entries.length, base[0].entries.length + 1);
});

t('store: addEntry ignoriert Duplikate und Leerstrings', () => {
  assert.equal(S.addEntry(base, fleisch, 'Steak')[0].entries.length, base[0].entries.length);
  assert.equal(S.addEntry(base, fleisch, '   ')[0].entries.length, base[0].entries.length);
});

t('store: removeEntry trifft den richtigen Index', () => {
  const next = S.removeEntry(base, fleisch, 0);
  assert.equal(next[0].entries[0], base[0].entries[1]);
  assert.equal(next[0].entries.length, base[0].entries.length - 1);
});

t('store: renameEntry ändert nur den einen Eintrag', () => {
  const next = S.renameEntry(base, fleisch, 1, 'Rinderfilet');
  assert.equal(next[0].entries[1], 'Rinderfilet');
  assert.equal(next[0].entries[0], base[0].entries[0]);
});

t('store: moveEntry tauscht und respektiert die Ränder', () => {
  const next = S.moveEntry(base, fleisch, 0, 1);
  assert.equal(next[0].entries[0], base[0].entries[1]);
  assert.equal(next[0].entries[1], base[0].entries[0]);
  assert.deepEqual(S.moveEntry(base, fleisch, 0, -1), base, 'über den Anfang hinaus');
  const last = base[0].entries.length - 1;
  assert.deepEqual(S.moveEntry(base, fleisch, last, 1), base, 'über das Ende hinaus');
});

t('store: moveGroup respektiert die Ränder', () => {
  assert.equal(S.moveGroup(base, base[0].id, 1)[0].id, base[1].id);
  assert.deepEqual(S.moveGroup(base, base[0].id, -1), base);
  assert.deepEqual(S.moveGroup(base, base[base.length-1].id, 1), base);
});

t('store: addGroup / removeGroup', () => {
  const added = S.addGroup(base, 'Beilagen', '🥔');
  assert.equal(added.length, base.length + 1);
  assert.equal(added[added.length-1].name, 'Beilagen');
  assert.equal(S.removeGroup(added, added[added.length-1].id).length, base.length);
});

t('store: parseGroups wirft kaputte Daten weg', () => {
  assert.equal(S.parseGroups('kein array'), null);
  assert.equal(S.parseGroups([]), null);
  assert.equal(S.parseGroups([{ name: '' }]), null, 'Gruppe ohne Namen');
  assert.equal(S.parseGroups([{ name: 'X', entries: 'kaputt' }])[0].entries.length, 0);
  assert.equal(S.parseGroups([{ name: 'X', entries: [1, null, ' Ok '] }])[0].entries[0], 'Ok');
});

t('store: parseGroups kappt überlange Namen', () => {
  const lang = 'x'.repeat(500);
  assert.equal(S.parseGroups([{ name: lang }])[0].name.length, 60);
});

t('store: parseGroups vergibt fehlende IDs', () => {
  const g = S.parseGroups([{ name: 'Ohne ID' }])[0];
  assert.ok(g.id && g.id.length > 0);
});
