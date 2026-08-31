import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from './store.js';
// Einträge sind Objekte { name, tage }; die Standardliste kommt normalisiert
const namen = (g) => g.entries.map((e) => e.name);

const t = test;

const base = S.resetGroups();
const fleisch = base[0].id;

t('store: addEntry mutiert das Original nicht', () => {
  const before = JSON.stringify(base);
  const next = S.addEntry(base, fleisch, 'Lammkarree');
  assert.equal(JSON.stringify(base), before, 'Original wurde verändert!');
  assert.ok(namen(next[0]).includes('Lammkarree'));
  assert.equal(next[0].entries.length, base[0].entries.length + 1);
});

t('store: addEntry ignoriert Duplikate und Leerstrings', () => {
  assert.equal(S.addEntry(base, fleisch, 'Steak')[0].entries.length, base[0].entries.length);
  assert.equal(S.addEntry(base, fleisch, '   ')[0].entries.length, base[0].entries.length);
});

t('store: removeEntry trifft den richtigen Index', () => {
  const next = S.removeEntry(base, fleisch, 0);
  assert.equal(next[0].entries[0].name, base[0].entries[1].name);
  assert.equal(next[0].entries.length, base[0].entries.length - 1);
});

t('store: renameEntry ändert nur den einen Eintrag', () => {
  const next = S.renameEntry(base, fleisch, 1, 'Rinderfilet');
  assert.equal(next[0].entries[1].name, 'Rinderfilet');
  assert.equal(next[0].entries[0].name, base[0].entries[0].name);
});

t('store: moveEntry tauscht und respektiert die Ränder', () => {
  const next = S.moveEntry(base, fleisch, 0, 1);
  assert.equal(next[0].entries[0].name, base[0].entries[1].name);
  assert.equal(next[0].entries[1].name, base[0].entries[0].name);
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
  assert.equal(S.parseGroups([{ name: 'X', entries: [1, null, ' Ok '] }])[0].entries[0].name, 'Ok');
});

t('store: parseGroups kappt überlange Namen', () => {
  const lang = 'x'.repeat(500);
  assert.equal(S.parseGroups([{ name: lang }])[0].name.length, 60);
});

t('store: parseGroups vergibt fehlende IDs', () => {
  const g = S.parseGroups([{ name: 'Ohne ID' }])[0];
  assert.ok(g.id && g.id.length > 0);
});

test('store: alte Listen mit reinen Namen werden übernommen', () => {
  const alt = [{ id: 'g', name: 'Alt', icon: '🏷️', entries: ['Steak', 'Filet'] }];
  assert.deepEqual(S.parseGroups(alt)[0].entries,
    [{ name: 'Steak', tage: null }, { name: 'Filet', tage: null }]);
});

test('store: Haltbarkeit setzen und säubern', () => {
  assert.equal(S.setEntryTage(base, fleisch, 0, 3)[0].entries[0].tage, 3);
  assert.equal(S.setEntryTage(base, fleisch, 0, 3)[0].entries[1].tage, null, 'andere bleiben unberührt');
  assert.equal(S.setEntryTage(base, fleisch, 0, '')[0].entries[0].tage, null);
  assert.equal(S.setEntryTage(base, fleisch, 0, -5)[0].entries[0].tage, null);
  assert.equal(S.setEntryTage(base, fleisch, 0, 9999)[0].entries[0].tage, 365);
});

test('store: Haltbarkeit überlebt Umbenennen', () => {
  const mit = S.setEntryTage(base, fleisch, 0, 4);
  assert.deepEqual(S.renameEntry(mit, fleisch, 0, 'Rumpsteak')[0].entries[0],
    { name: 'Rumpsteak', tage: 4 });
});

test('store: Hinzufügen nimmt eine Haltbarkeit entgegen', () => {
  assert.deepEqual(S.addEntry(base, fleisch, 'Tatar', 2)[0].entries.at(-1),
    { name: 'Tatar', tage: 2 });
});
