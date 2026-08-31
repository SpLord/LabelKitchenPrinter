import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PFAD, ablegen, holen } from './fernspeicher.js';
import { buildBackup } from './backup.js';
import { resetGroups } from './store.js';

const GRUPPEN = resetGroups();
const antwort = (status, text = '') => ({ status, ok: status >= 200 && status < 300, text: async () => text });

test('fernspeicher: gefundene Liste wird gelesen und geprüft', async () => {
  const r = await holen(async () => antwort(200, JSON.stringify(buildBackup(GRUPPEN))));
  assert.equal(r.zustand, 'gefunden');
  assert.equal(r.groups.length, GRUPPEN.length);
});

test('fernspeicher: 204 und 404 heissen "noch nichts abgelegt"', async () => {
  assert.equal((await holen(async () => antwort(204))).zustand, 'leer');
  assert.equal((await holen(async () => antwort(404))).zustand, 'leer');
  assert.equal((await holen(async () => antwort(200, '   '))).zustand, 'leer');
});

test('fernspeicher: unlesbarer Inhalt ist ein Fehler, kein Datenverlust', async () => {
  const r = await holen(async () => antwort(200, '{ kaputt'));
  assert.equal(r.zustand, 'fehler');
  assert.match(r.grund, /JSON/);
});

test('fernspeicher: fremdes Format wird abgewiesen', async () => {
  const r = await holen(async () => antwort(200, JSON.stringify({ format: 'etwas-anderes', groups: GRUPPEN })));
  assert.equal(r.zustand, 'fehler');
});

test('fernspeicher: Netzfehler und Zeitüberschreitung werden unterschieden', async () => {
  const netz = await holen(async () => { throw new Error('down'); });
  assert.equal(netz.zustand, 'fehler');
  assert.equal(netz.grund, 'nicht erreichbar');

  const zeit = await holen(async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; });
  assert.equal(zeit.grund, 'Zeitüberschreitung');
});

test('fernspeicher: Serverfehler wird gemeldet', async () => {
  assert.equal((await holen(async () => antwort(500))).grund, 'HTTP 500');
});

test('fernspeicher: Ablegen schickt ein vollständiges Sicherungsformat an den richtigen Pfad', async () => {
  let gesehen = null;
  const r = await ablegen(GRUPPEN, async (pfad, opt) => { gesehen = { pfad, opt }; return antwort(201); });
  assert.equal(r.ok, true);
  assert.equal(gesehen.pfad, PFAD);
  assert.equal(gesehen.opt.method, 'PUT');
  const geschickt = JSON.parse(gesehen.opt.body);
  assert.equal(geschickt.format, 'labelkitchen-etiketten');
  assert.equal(geschickt.groups.length, GRUPPEN.length);
});

test('fernspeicher: Ablegen meldet Fehlschläge statt sie zu schlucken', async () => {
  assert.deepEqual(await ablegen(GRUPPEN, async () => antwort(403)), { ok: false, grund: 'HTTP 403' });
  assert.deepEqual(await ablegen(GRUPPEN, async () => { throw new Error('weg'); }), { ok: false, grund: 'nicht erreichbar' });
});
