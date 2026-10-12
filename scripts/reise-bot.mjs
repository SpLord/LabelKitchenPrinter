/*
  Ausbalancieren der Leckerli-Reise: lässt den Bot jedes Level mehrmals
  spielen und zeigt Gewinnquote, mittlere Punkte und Sternverteilung.
  Aufruf: node scripts/reise-bot.mjs [runden] [ab-level] [bis-level]
*/
import { LEVEL } from '../src/zimmer/reise/level.js';
import { botSpiel } from '../src/zimmer/reise/bot.js';

const runden = Number(process.argv[2] ?? 12);
const von = Number(process.argv[3] ?? 1);
const bis = Number(process.argv[4] ?? LEVEL.length);
const zufallAus = (saat) => { let x = saat; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };

for (const level of LEVEL.filter((l) => l.nr >= von && l.nr <= bis)) {
  const ergebnisse = Array.from({ length: runden }, (_, k) => botSpiel(level, zufallAus(k * 7919 + level.nr)));
  const gewonnen = ergebnisse.filter((e) => e.gewonnen);
  const p = gewonnen.map((e) => e.punkte).sort((a, b) => a - b);
  const median = p.length ? p[Math.floor(p.length / 2)] : 0;
  const sterne = [1, 2, 3].map((n) => gewonnen.filter((e) => e.sterne === n).length);
  const q = (anteil) => (p.length ? Math.round(p[Math.min(p.length - 1, Math.floor(p.length * anteil))] / 100) * 100 : 0);
  const vorschlag = `Sterne-Vorschlag [${q(0.4)}, ${q(0.85)}]`;
  console.log(`L${String(level.nr).padStart(2)}  ${String(Math.round((gewonnen.length / runden) * 100)).padStart(3)} %  Median ${String(median).padStart(5)}  Sterne 1/2/3: ${sterne.join('/')}  Rest-Züge Ø ${(gewonnen.reduce((s, e) => s + e.restZuege, 0) / Math.max(1, gewonnen.length)).toFixed(1)}  ${vorschlag}`);
}
