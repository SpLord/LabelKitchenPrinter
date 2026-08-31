import { test, expect, menuepunkt } from './hilfen.js';

/* Elemente, die frei über der Seite schweben und sich deshalb überdecken können. */
const SCHWEBEND = ['.coin-counter', '.status-indicator', '.edit-toggle', '.drucker-wahl',
                   '.version-badge', '.print-error'];

const ueberlappungen = (page, sels) => page.evaluate((liste) => {
  const kaesten = liste
    .map((s) => { const e = document.querySelector(s); if (!e) return null;
      const r = e.getBoundingClientRect(); return r.width ? { s, r } : null; })
    .filter(Boolean);
  const treffer = [];
  for (let i = 0; i < kaesten.length; i += 1) {
    for (let j = i + 1; j < kaesten.length; j += 1) {
      const a = kaesten[i].r, b = kaesten[j].r;
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 1 && y > 1) treffer.push(`${kaesten[i].s} ⨯ ${kaesten[j].s} (${Math.round(x)}x${Math.round(y)}px)`);
    }
  }
  return treffer;
}, sels);

test('nichts überdeckt sich in der Kopfleiste', async ({ seite }) => {
  // Die Münzanzeige der Katze liegt fixiert oben links; die Kopfleiste muss
  // ausweichen. Genau hier lag schon zweimal ein Fehler.
  expect(await ueberlappungen(seite, SCHWEBEND)).toEqual([]);
});

test('auch mit Fehlermeldung bleibt alles frei', async ({ seite }) => {
  await seite.fill('.side-rail .input-group input', 'Testetikett');
  await seite.evaluate(() => { window.dymo = undefined; });
  await seite.click('.side-rail .input-group button');
  await expect(seite.locator('.print-error')).toBeVisible();
  expect(await ueberlappungen(seite, SCHWEBEND)).toEqual([]);
});

test('das Hütchenspiel steht mittig auf dem Bildschirm', async ({ seite }) => {
  // Es wurde früher innerhalb des Katzen-Sprites gerendert, dessen
  // Transform-Animation den Bezugsrahmen bildete – das Brett klebte an der
  // Katze und wanderte mit ihr.
  const knopf = await menuepunkt(seite, /Hütchenspiel/);
  await knopf.click();
  await expect(seite.locator('.shell-board')).toBeVisible();

  const mass = await seite.evaluate(() => {
    const b = document.querySelector('.shell-board').getBoundingClientRect();
    const o = document.querySelector('.shell-overlay').getBoundingClientRect();
    return { abweichungX: Math.abs(b.x + b.width / 2 - innerWidth / 2),
             abweichungY: Math.abs(b.y + b.height / 2 - innerHeight / 2),
             overlayVoll: Math.round(o.width) === innerWidth && Math.round(o.height) === innerHeight };
  });
  expect(mass.overlayVoll).toBe(true);
  expect(mass.abweichungX).toBeLessThan(2);
  expect(mass.abweichungY).toBeLessThan(2);
});

test('beim Merken ist die Münze wirklich zu sehen', async ({ seite }) => {
  const knopf = await menuepunkt(seite, /Hütchenspiel/);
  await knopf.click();
  await seite.waitForSelector('.shell-coin');
  await seite.waitForTimeout(350); // Deckel hebt sich

  const sicht = await seite.evaluate(() => {
    const m = document.querySelector('.shell-coin').getBoundingClientRect();
    const deckel = document.querySelector('.cup.lifted .cup-top').getBoundingClientRect();
    const stil = getComputedStyle(document.querySelector('.shell-coin'));
    return { freiUnterDemDeckel: m.top >= deckel.bottom - 1,
             groesse: Math.round(m.width), deckkraft: Number(stil.opacity) };
  });
  // Die Münze lag im Markup vor dem Becherdeckel und war nie sichtbar.
  expect(sicht.freiUnterDemDeckel).toBe(true);
  expect(sicht.groesse).toBeGreaterThan(30);
  expect(sicht.deckkraft).toBe(1);
});
