import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLE, FELLE, ZUBEHOER, ablegen, angelegtesFell, anlegen, artikel,
  fortschritt, istAngelegt, istFell, kaufen, putzeBesitz,
} from './laden.js';

test('laden: Katalog ist schlüssig', () => {
  assert.equal(ALLE.length, FELLE.length + ZUBEHOER.length);
  assert.equal(new Set(ALLE.map((a) => a.id)).size, ALLE.length, 'Kennungen doppelt');
  assert.ok(ALLE.every((a) => a.preis > 0 && Number.isInteger(a.preis)));
  // Der Laden muss deutlich über den heutigen Stand von rund 1410 hinausreichen
  assert.ok(Math.max(...ALLE.map((a) => a.preis)) >= 3000);
  assert.ok(ALLE.reduce((s, a) => s + a.preis, 0) > 10000, 'Gesamtpreis als Langzeitziel');
});

test('laden: Fellvarianten zeigen auf gültige Indizes', () => {
  assert.ok(FELLE.every((f) => Number.isInteger(f.variante) && f.variante >= 0 && f.variante < 10));
  assert.equal(new Set(FELLE.map((f) => f.variante)).size, FELLE.length, 'Variante doppelt vergeben');
});

test('laden: Kaufen bucht ab und trägt ein', () => {
  const z = kaufen({ muenzen: 500, besitz: [] }, 'halsband');
  assert.equal(z.ok, true);
  assert.equal(z.muenzen, 250);
  assert.deepEqual(z.besitz, ['halsband']);
});

test('laden: zu wenig Münzen, doppelt, unbekannt', () => {
  assert.equal(kaufen({ muenzen: 10, besitz: [] }, 'halsband').grund, 'zu teuer');
  assert.equal(kaufen({ muenzen: 10, besitz: [] }, 'halsband').muenzen, 10, 'nichts abgebucht');
  assert.equal(kaufen({ muenzen: 999, besitz: ['halsband'] }, 'halsband').grund, 'schon gekauft');
  assert.equal(kaufen({ muenzen: 999, besitz: [] }, 'gibtsnicht').grund, 'unbekannt');
});

test('laden: nur Gekauftes lässt sich anlegen', () => {
  assert.deepEqual(anlegen([], {}, 'hut'), {}, 'nicht gekauft, nichts passiert');
  assert.deepEqual(anlegen(['hut'], {}, 'hut'), { hut: true });
});

test('laden: immer nur ein Fell', () => {
  let a = anlegen(['fell-blau', 'fell-rosa'], {}, 'fell-blau');
  assert.equal(a.fell, 'fell-blau');
  a = anlegen(['fell-blau', 'fell-rosa'], a, 'fell-rosa');
  assert.equal(a.fell, 'fell-rosa', 'das alte wird ersetzt, nicht ergänzt');
});

test('laden: Zubehör lässt sich kombinieren', () => {
  let a = anlegen(['hut', 'brille'], {}, 'hut');
  a = anlegen(['hut', 'brille'], a, 'brille');
  assert.ok(istAngelegt(a, 'hut') && istAngelegt(a, 'brille'));
});

test('laden: Ablegen', () => {
  const a = anlegen(['hut'], {}, 'hut');
  assert.equal(istAngelegt(ablegen(a, 'hut'), 'hut'), false);
  const f = anlegen(['fell-blau'], {}, 'fell-blau');
  assert.equal(ablegen(f, 'fell-blau').fell, undefined);
  assert.equal(ablegen(f, 'fell-rosa').fell, 'fell-blau', 'fremdes Fell legt nichts ab');
});

test('laden: angelegtes Fell liefert den Variantenindex', () => {
  assert.equal(angelegtesFell({ fell: 'fell-tuxedo' }), 6);
  assert.equal(angelegtesFell({}), null, 'ohne Fell bleibt die übliche Rotation');
  assert.equal(angelegtesFell({ fell: 'quatsch' }), null);
  assert.equal(angelegtesFell(null), null);
});

test('laden: gespeicherter Besitz wird gesäubert', () => {
  assert.deepEqual(putzeBesitz(['hut', 'gibtsnicht', 'hut', 42, null]), ['hut']);
  assert.deepEqual(putzeBesitz('quatsch'), []);
  assert.deepEqual(putzeBesitz(null), []);
});

test('laden: Fortschritt', () => {
  const f = fortschritt(['halsband', 'hut']);
  assert.equal(f.gekauft, 2);
  assert.equal(f.gesamt, ALLE.length);
  assert.equal(f.ausgegeben, 250 + 1800);
});

test('laden: istFell trennt die Kategorien', () => {
  assert.equal(istFell('fell-blau'), true);
  assert.equal(istFell('hut'), false);
  assert.equal(artikel('hut').preis, 1800);
});
