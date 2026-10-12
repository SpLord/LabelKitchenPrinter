import { gueltig, startBrett, zug } from './brett.js';
import { ZUG_BONUS, anfang, geschafft, sterne, zielStand } from './level.js';

/*
  Ein einfacher Mitspieler zum Ausbalancieren der Level: wählt in jedem Zug
  den Tausch, der die Ziele am weitesten voranbringt (bei Gleichstand die
  meisten Punkte). Ein Mensch spielt vorausschauender, aber schlampiger –
  die Gewinnquote des Bots ist ein brauchbarer Massstab für die Schwierigkeit.
  Nur für Tests und scripts/reise-bot.mjs, nicht im Spiel.
*/
const paare = (n) => {
  const p = [];
  for (let i = 0; i < n * n; i += 1) { if (i % n < n - 1) p.push([i, i + 1]); if (i < n * (n - 1)) p.push([i, i + n]); }
  return p;
};

const fortschrittWert = (staende) => staende.reduce((w, z) => w + Math.min(1, z.ist / Math.max(1, z.soll)), 0);
/* Wie ein Mensch: Dosen, die tiefer liegen, sind schon halb geschafft. */
const dosenTiefe = (s) => s.felder.reduce((w, f, i) => (f?.art === 'dose' ? w + Math.floor(i / s.n) / s.n : w), 0);

export function botSpiel(level, zufall) {
  let s = startBrett(level.vorlage, level.arten, zufall);
  const a = anfang(s);
  let stand = { punkte: 0, gesammelt: {} };
  const alle = paare(s.n);
  for (let zuege = level.zuege; zuege > 0; zuege -= 1) {
    let best = null;
    for (const [x, y] of alle) {
      if (!gueltig(s, x, y)) continue;
      // Gleicher Zufall für alle Kandidaten, damit der Vergleich fair ist
      const probe = zug(s, x, y, level.arten, () => 0.37);
      const neu = { punkte: stand.punkte + probe.punkte, gesammelt: { ...stand.gesammelt } };
      Object.entries(probe.gesammelt).forEach(([k, n]) => { neu.gesammelt[k] = (neu.gesammelt[k] ?? 0) + n; });
      const wert = fortschrittWert(zielStand(level, neu, probe.s, a)) * 10_000 + dosenTiefe(probe.s) * 3_000 + probe.punkte;
      if (!best || wert > best.wert) best = { wert, x, y };
    }
    const r = zug(s, best.x, best.y, level.arten, zufall);
    s = r.s;
    stand = { punkte: stand.punkte + r.punkte, gesammelt: { ...stand.gesammelt } };
    Object.entries(r.gesammelt).forEach(([k, n]) => { stand.gesammelt[k] = (stand.gesammelt[k] ?? 0) + n; });
    if (geschafft(zielStand(level, stand, s, a))) {
      const end = stand.punkte + (zuege - 1) * ZUG_BONUS;
      return { gewonnen: true, punkte: end, sterne: sterne(level, end, true), restZuege: zuege - 1 };
    }
  }
  return { gewonnen: false, punkte: stand.punkte, sterne: 0, restZuege: 0 };
}
