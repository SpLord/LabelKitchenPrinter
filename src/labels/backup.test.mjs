import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBackup, backupFileName, readBackup } from './backup.js';
import { DEFAULT_GROUPS } from './defaults.js';

test('backup: Runde Export → Import erhält die Gruppen', () => {
  const text = JSON.stringify(buildBackup(DEFAULT_GROUPS));
  const r = readBackup(text);
  assert.ok(r.ok);
  assert.equal(r.groups.length, DEFAULT_GROUPS.length);
  assert.deepEqual(r.groups.map(g => g.name), DEFAULT_GROUPS.map(g => g.name));
  assert.deepEqual(r.groups[0].entries, DEFAULT_GROUPS[0].entries);
});

test('backup: nimmt auch eine nackte Gruppenliste an', () => {
  const r = readBackup(JSON.stringify(DEFAULT_GROUPS));
  assert.ok(r.ok);
  assert.equal(r.groups.length, DEFAULT_GROUPS.length);
});

test('backup: weist kaputtes JSON ab', () => {
  const r = readBackup('{ kein json');
  assert.equal(r.ok, false);
  assert.match(r.error, /JSON/);
});

test('backup: weist fremdes Format ab', () => {
  const r = readBackup(JSON.stringify({ format: 'etwas-anderes', groups: DEFAULT_GROUPS }));
  assert.equal(r.ok, false);
  assert.match(r.error, /anderen Anwendung/);
});

test('backup: weist inhaltslose Dateien ab', () => {
  assert.equal(readBackup(JSON.stringify({ groups: [] })).ok, false);
  assert.equal(readBackup(JSON.stringify({ groups: 'quatsch' })).ok, false);
  assert.equal(readBackup(JSON.stringify({})).ok, false);
});

test('backup: säubert beim Import (Validierung greift)', () => {
  const r = readBackup(JSON.stringify({ groups: [{ name: '  Test  ', entries: [1, null, ' Steak '] }] }));
  assert.ok(r.ok);
  assert.equal(r.groups[0].name, 'Test');
  assert.deepEqual(r.groups[0].entries, ['Steak']);
});

test('backup: Dateiname enthält das Datum', () => {
  assert.equal(backupFileName(new Date('2026-08-31T10:00:00Z')), 'etiketten-2026-08-31.json');
});
