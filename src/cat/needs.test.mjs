import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONDITIONS, DECAY_PER_HOUR, MAX_OFFLINE_DECAY, NEED_MAX, catchUp, clampNeed, coinsFor,
  conditionOf, conditionValue, decayOver, feed,
} from './needs.js';
import { KRANK_SCHWELLE } from './tamagotchi.js';

test('needs: clampNeed hält 0..100 und fängt Unsinn ab', () => {
  assert.equal(clampNeed(150), 100);
  assert.equal(clampNeed(-20), 0);
  assert.equal(clampNeed(NaN), 100);
  assert.equal(clampNeed(undefined), 100);
  assert.equal(clampNeed(42), 42);
});

test('needs: der schlechtere Wert bestimmt den Zustand', () => {
  assert.equal(conditionValue(90, 10), 10);
  assert.equal(conditionOf(90, 10).key, 'schwach');
  assert.equal(conditionOf(80, 80).key, 'munter');
});

test('needs: jede Stufe wird an ihrer Grenze getroffen', () => {
  assert.equal(conditionOf(100, 100).key, 'munter');
  assert.equal(conditionOf(70, 70).key, 'munter');
  assert.equal(conditionOf(69, 69).key, 'normal');
  assert.equal(conditionOf(40, 40).key, 'normal');
  assert.equal(conditionOf(39, 39).key, 'traege');
  assert.equal(conditionOf(15, 15).key, 'traege');
  assert.equal(conditionOf(14, 14).key, 'schwach');
  assert.equal(conditionOf(0, 0).key, 'schwach');
});

test('needs: Münzgewinn folgt dem Zustand', () => {
  assert.equal(coinsFor(2, 100, 100), 3);   // munter, 1.5x
  assert.equal(coinsFor(2, 50, 50), 2);     // zufrieden
  assert.equal(coinsFor(2, 20, 20), 1);     // träge
  assert.equal(coinsFor(2, 5, 5), 0);       // schwach – gar nichts
  assert.equal(coinsFor(1, 5, 5), 0);
});

test('needs: Münzgewinn ist nie negativ oder gebrochen', () => {
  for (const h of [0, 14, 15, 39, 40, 69, 70, 100]) {
    const v = coinsFor(3, h, h);
    assert.ok(Number.isInteger(v) && v >= 0, `ungültig bei ${h}: ${v}`);
  }
});

test('needs: Verfall entspricht der Zeit', () => {
  // Aus der Rate abgeleitet – die Zahl selbst wird oben von den beiden
  // Betriebsfällen eingegrenzt, hier geht es nur um die Linearität.
  assert.equal(decayOver(100, 3_600_000), 100 - DECAY_PER_HOUR);
  assert.equal(decayOver(100, 8 * 3_600_000), 100 - 8 * DECAY_PER_HOUR);
  assert.equal(decayOver(10, 400 * 3_600_000), 0);      // nie unter 0
  assert.equal(decayOver(50, 0), 50);
  assert.equal(decayOver(50, -100), 50);
});

test('needs: Abwesenheit ist gedeckelt', () => {
  const nach = catchUp({ hunger: 100, thirst: 100, lastSeen: Date.now() - 30 * 24 * 3_600_000 });
  assert.equal(nach.hunger, 100 - MAX_OFFLINE_DECAY);
  assert.equal(nach.thirst, 100 - MAX_OFFLINE_DECAY);
});

test('needs: ohne lastSeen passiert nichts', () => {
  const nach = catchUp({ hunger: 60, thirst: 70, lastSeen: undefined });
  assert.deepEqual(nach, { hunger: 60, thirst: 70 });
});

test('needs: Füttern füllt auf, aber nicht über 100', () => {
  assert.equal(feed(50, 20), 70);
  assert.equal(feed(95, 35), 100);
  assert.equal(feed(50, -10), 50);
});

test('needs: Stufen sind absteigend sortiert (sonst greift find() falsch)', () => {
  const mins = CONDITIONS.map((c) => c.min);
  assert.deepEqual(mins, [...mins].sort((a, b) => b - a));
});

test('needs: fehlender Speicherwert darf nicht als 0 gelesen werden', () => {
  // Number(null) ist 0 und Number.isFinite(0) ist true – ohne ausdrückliche
  // Prüfung startete die Katze auf einem frischen Gerät bei 0 % statt satt.
  assert.equal(Number(null), 0, 'Annahme über das Verhalten von Number()');
  assert.equal(Number.isFinite(Number(null)), true, 'deshalb reicht isFinite nicht');
});

/*
  Ausstattung aus dem Laden bremst den Verfall. Das muss auch für die
  Abwesenheit gelten – sonst wäre der Futterautomat ausgerechnet über Nacht
  wirkungslos, also genau dann, wenn er zählt.
*/
test('catchUp: Bremsfaktoren wirken auch über die Abwesenheit', () => {
  // Zwei Stunden: knapp unter dem Deckel von 25 Punkten, sonst verdeckt der
  // Deckel den Unterschied, den dieser Test zeigen soll.
  const zweiStunden = 2 * 3_600_000;
  const jetzt = 1_000_000_000_000;
  const ohne = catchUp({ hunger: 100, thirst: 100, lastSeen: jetzt - zweiStunden }, jetzt);
  const mit = catchUp(
    { hunger: 100, thirst: 100, lastSeen: jetzt - zweiStunden, hungerFaktor: 0.5, durstFaktor: 1 },
    jetzt,
  );
  // Aus der Konstante abgeleitet: eine feste Zahl müsste bei jeder
  // Justierung der Rate mit angefasst werden und sagt nichts über die Regel.
  assert.equal(ohne.hunger, 100 - 2 * DECAY_PER_HOUR, 'volle Rate über zwei Stunden');
  assert.equal(mit.hunger, 100 - DECAY_PER_HOUR, 'halber Verfall');
  assert.equal(mit.thirst, ohne.thirst, 'ohne eigenen Faktor unverändert');
});

test('catchUp: fehlende Faktoren ändern nichts', () => {
  const jetzt = 1_000_000_000_000;
  const lastSeen = jetzt - 3_600_000;
  assert.deepEqual(
    catchUp({ hunger: 90, thirst: 80, lastSeen, hungerFaktor: 1, durstFaktor: 1 }, jetzt),
    catchUp({ hunger: 90, thirst: 80, lastSeen }, jetzt),
  );
});

/*
  Wie streng darf der Verfall sein?

  Die alte Rate von 12 %/h leerte eine volle Katze in achteinhalb Stunden –
  zwischen Frühschicht und Feierabend. Rückmeldung aus der Küche: "so schnell
  ist keine Katze verhungert oder verdurstet."

  Der Massstab ist deshalb nicht eine Wunschzahl, sondern ein Fall aus dem
  Betrieb: Freitagabend geht das Licht aus, Montagfrüh kommt jemand wieder.
  Wer die Katze vorher satt zurücklässt, darf montags keine kranke vorfinden.
*/
const WOCHENENDE_H = 60;   // Fr 18:00 bis Mo 06:00

test('Verfall: satt zurückgelassen übersteht die Katze ein Wochenende', () => {
  const rest = decayOver(NEED_MAX, WOCHENENDE_H * 3_600_000);
  assert.ok(
    rest > KRANK_SCHWELLE,
    `nach ${WOCHENENDE_H} h wären es ${rest} % – unter ${KRANK_SCHWELLE} % wird sie krank`,
  );
});

test('Verfall: trotzdem spürbar – innerhalb eines Tages geht es merklich runter', () => {
  const nachEinemTag = decayOver(NEED_MAX, 24 * 3_600_000);
  assert.ok(nachEinemTag < 80, 'sonst müsste man nie füttern');
  assert.ok(nachEinemTag > 50, 'aber auch nicht halb leer nach einem Tag');
});
