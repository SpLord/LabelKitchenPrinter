import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DRUCK_DROSSEL_MS, bereinigeEreignis, bereinigeKruemel, leseKonfig, platzhalterDsn, sollDruckfehlerMelden,
} from './bugsink.js';

// ── Konfiguration vom Server ────────────────────────────────────────────────

test('Konfig: nur eine eindeutige Freigabe schaltet das Melden ein', () => {
  assert.deepEqual(leseKonfig({ enabled: true, projekt: '9', environment: 'production' }),
    { projekt: '9', environment: 'production' });
  for (const kaputt of [null, undefined, 'ja', {}, { enabled: 'true', projekt: '9' },
    { enabled: false, projekt: '9' }, { enabled: true }, { enabled: true, projekt: 'x' },
    { enabled: true, projekt: '9/../1' }]) {
    assert.equal(leseKonfig(kaputt), null, `muss abgelehnt werden: ${JSON.stringify(kaputt)}`);
  }
});

test('Konfig: unbrauchbare Umgebung fällt auf production zurück', () => {
  assert.equal(leseKonfig({ enabled: true, projekt: '9' }).environment, 'production');
  assert.equal(leseKonfig({ enabled: true, projekt: '9', environment: '<script>' }).environment, 'production');
});

// ── Platzhalter-DSN ─────────────────────────────────────────────────────────

/*
  Der echte DSN bleibt im Container. Der Browser bekommt einen Platzhalter,
  der auf den eigenen Ursprung zeigt: das SDK schickt dann an /api/<projekt>/
  envelope/ beim Küchenserver, und nginx setzt den echten Schlüssel ein.
*/
test('Platzhalter-DSN zeigt auf den eigenen Ursprung und trägt keinen echten Schlüssel', () => {
  const dsn = platzhalterDsn({ protocol: 'http:', host: '192.168.10.57:7077' }, '9');
  assert.equal(dsn, 'http://labelkitchen@192.168.10.57:7077/9');
  assert.ok(!/[0-9a-f]{32}/.test(dsn), 'kein UUID-artiger Schlüssel');
});

// ── Bereinigen ──────────────────────────────────────────────────────────────

test('Ereignis: kein Nutzer, Adresse ohne Query und Fragment', () => {
  const aus = bereinigeEreignis({
    user: { ip_address: '192.168.10.23' },
    request: { url: 'http://192.168.10.57:7077/?x=1#y', headers: { Cookie: 'a' } },
    message: 'ok',
  });
  assert.equal(aus.user, undefined);
  assert.deepEqual(aus.request, { url: 'http://192.168.10.57:7077/' });
  assert.equal(aus.message, 'ok');
});

test('Krümel: Konsole fällt weg, Netzwerk nur Methode, Pfad und Status', () => {
  assert.equal(bereinigeKruemel({ category: 'console', message: 'irgendwas' }), null);
  assert.deepEqual(
    bereinigeKruemel({ category: 'fetch', data: { method: 'PUT', url: '/daten/etiketten.json?t=1', status_code: 500, body: 'x' } }),
    { category: 'fetch', data: { method: 'PUT', url: '/daten/etiketten.json', status_code: 500 } },
  );
  assert.deepEqual(
    bereinigeKruemel({ category: 'navigation', data: { from: '/?a=1#x', to: '/b?c=2' } }),
    { category: 'navigation', data: { from: '/', to: '/b' } },
  );
  assert.deepEqual(bereinigeKruemel({ category: 'ui.click', message: 'button' }),
    { category: 'ui.click', message: 'button' });
});

// ── Drosseln ────────────────────────────────────────────────────────────────

/*
  Jede neue Bugsink-Meldung startet eine Triage-Routine. Ein streikender
  Drucker darf deshalb nicht bei jedem Klick melden.
*/
test('Druckfehler: je Grund höchstens einmal pro Minute', () => {
  const merk = new Map();
  const t0 = 1_000_000;
  assert.equal(sollDruckfehlerMelden(merk, 'Print job failed', t0), true);
  assert.equal(sollDruckfehlerMelden(merk, 'Print job failed', t0 + 1000), false);
  assert.equal(sollDruckfehlerMelden(merk, 'anderer Grund', t0 + 1000), true, 'anderer Grund zählt eigens');
  assert.equal(sollDruckfehlerMelden(merk, 'Print job failed', t0 + DRUCK_DROSSEL_MS), true);
});

test('Druckfehler: der Merkspeicher wächst nicht unbegrenzt', () => {
  const merk = new Map();
  for (let i = 0; i < 500; i += 1) sollDruckfehlerMelden(merk, `grund ${i}`, i);
  assert.ok(merk.size <= 50);
});
