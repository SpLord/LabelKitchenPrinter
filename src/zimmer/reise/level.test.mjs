import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LECKERLI, startBrett } from './brett.js';
import {
  LEVEL, LOHN, WELTEN, anfang, ergebnisEintragen, fortschrittLesen, freigeschaltet, geschafft,
  gesamtSterne, leererFortschritt, naechstesLevel, sterne, zielStand,
} from './level.js';
import { botSpiel } from './bot.js';

const zufallAus = (saat) => { let x = saat; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };

test('Level: dreissig Stück in drei Welten, jede Vorlage 7 × 7 aus gültigen Zeichen', () => {
  assert.equal(LEVEL.length, 30);
  assert.deepEqual([...new Set(LEVEL.map((l) => l.welt))], WELTEN.map((w) => w.id));
  for (const l of LEVEL) {
    assert.equal(l.vorlage.length, 7, `L${l.nr}`);
    for (const z of l.vorlage) assert.match(z, /^[.pPkKd]{7}$/, `L${l.nr}: ${z}`);
    assert.ok(l.zuege >= 10 && l.zuege <= 40, `L${l.nr} Züge`);
    assert.ok(l.sterne[0] < l.sterne[1], `L${l.nr} Sterne aufsteigend`);
    assert.ok(l.arten.every((a) => LECKERLI.includes(a)));
  }
});

test('Level: jedes Ziel passt zur Vorlage (keine Kisten-Ziele ohne Kisten …)', () => {
  for (const l of LEVEL) {
    const s = startBrett(l.vorlage, l.arten, zufallAus(l.nr));
    const a = anfang(s);
    for (const z of l.ziele) {
      if (z.typ === 'kisten') assert.ok(a.kisten > 0, `L${l.nr} Kisten`);
      if (z.typ === 'pfuetzen') assert.ok(a.pfuetzen > 0, `L${l.nr} Pfützen`);
      if (z.typ === 'dosen') assert.ok(a.dosen > 0, `L${l.nr} Dosen`);
      if (z.typ === 'sammeln') assert.ok(l.arten.includes(z.art), `L${l.nr} sammelt ${z.art}`);
      if (z.typ === 'punkte') assert.ok(z.n < l.sterne[0], `L${l.nr}: zweiter Stern über dem Punkteziel`);
    }
    // Dosen nie in der untersten Zeile – sie wären sofort weg
    assert.ok(!l.vorlage[6].includes('d'), `L${l.nr}`);
  }
});

test('Level: die ersten fünf schafft selbst der einfache Bot fast immer', () => {
  for (const l of LEVEL.slice(0, 5)) {
    const siege = [1, 2, 3, 4].filter((k) => botSpiel(l, zufallAus(k * 31 + l.nr)).gewonnen).length;
    assert.ok(siege >= 3, `L${l.nr}: ${siege}/4`);
  }
});

test('Ziele: Stand je Ziel, geschafft erst wenn alle erfüllt', () => {
  const l = LEVEL[6];   // Pfützen + Wolle
  const s = startBrett(l.vorlage, l.arten, zufallAus(1));
  const a = anfang(s);
  const vorher = zielStand(l, { punkte: 0, gesammelt: {} }, s, a);
  assert.equal(vorher.length, 2);
  assert.equal(geschafft(vorher), false);
  const ohnePfuetzen = { ...s, pfuetzen: s.pfuetzen.map(() => 0) };
  const halb = zielStand(l, { punkte: 0, gesammelt: { wolle: 3 } }, ohnePfuetzen, a);
  assert.equal(halb[0].fertig, true);
  assert.equal(halb[1].ist, 3);
  assert.equal(geschafft(halb), false);
  assert.equal(geschafft(zielStand(l, { punkte: 0, gesammelt: { wolle: 99 } }, ohnePfuetzen, a)), true);
  assert.equal(zielStand(l, { punkte: 0, gesammelt: { wolle: 99 } }, ohnePfuetzen, a)[1].ist, 15, 'gedeckelt');
});

test('Sterne: ohne Ziele keiner, sonst nach Punkten 1–3', () => {
  const l = LEVEL[0];
  assert.equal(sterne(l, 99_999, false), 0);
  assert.equal(sterne(l, 0, true), 1);
  assert.equal(sterne(l, l.sterne[0], true), 2);
  assert.equal(sterne(l, l.sterne[1], true), 3);
});

test('Fortschritt: Freischalten der Reihe nach, kaputter Speicher fängt von vorn an', () => {
  const f = leererFortschritt();
  assert.equal(freigeschaltet(f, 1), true);
  assert.equal(freigeschaltet(f, 2), false);
  const { fortschritt } = ergebnisEintragen(f, 1, 2, 1500);
  assert.equal(freigeschaltet(fortschritt, 2), true);
  assert.equal(naechstesLevel(fortschritt), 2);
  assert.equal(gesamtSterne(fortschritt), 2);
  assert.deepEqual(fortschrittLesen('kaputt'), leererFortschritt());
  assert.deepEqual(fortschrittLesen(JSON.stringify({ sterne: { 1: 7, 99: 2, 2: -1 } })).sterne, { 1: 3 });
});

test('Münzen: fürs erste Schaffen und für jeden neuen Stern – Wiederholen bringt nichts', () => {
  const f0 = leererFortschritt();
  const a = ergebnisEintragen(f0, 3, 1, 1000);
  assert.equal(a.lohn, LOHN.erstmals + LOHN.jeStern);
  const b = ergebnisEintragen(a.fortschritt, 3, 1, 900);
  assert.equal(b.lohn, 0, 'gleich gut nochmal: nichts');
  assert.equal(b.fortschritt.rekord[3], 1000, 'Rekord bleibt');
  const c = ergebnisEintragen(b.fortschritt, 3, 3, 2500);
  assert.equal(c.lohn, 2 * LOHN.jeStern);
  const verloren = ergebnisEintragen(c.fortschritt, 3, 0, 5000);
  assert.equal(verloren.lohn, 0, 'verloren: nichts');
  assert.equal(verloren.fortschritt.rekord[3], 2500, 'verloren ist kein Rekord');
  assert.equal(verloren.fortschritt.sterne[3], 3, 'Sterne bleiben');
});
