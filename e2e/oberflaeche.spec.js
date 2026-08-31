import { test, expect, grundaufbau, menuepunkt } from './hilfen.js';

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

/*
  Die Projekte decken nur 1024 und 1920 ab. Als die Münzanzeige um Phase und
  Herzen wuchs, überlappte es bei 1280 und 1201 – beide Projektbreiten blieben
  grün. Deshalb hier ein ausdrücklicher Durchlauf über die Zwischenbreiten.
*/
const BREITEN = [1920, 1600, 1440, 1401, 1366, 1280, 1201, 1100, 1024, 900, 820, 768];

test('die Kopfleiste bleibt über alle Breiten frei', async ({ seite }) => {
  const kaputt = [];
  for (const breite of BREITEN) {
    await seite.setViewportSize({ width: breite, height: 800 });
    await seite.waitForTimeout(120);
    const treffer = await ueberlappungen(seite, SCHWEBEND);
    if (treffer.length) kaputt.push(`${breite}px: ${treffer.join(', ')}`);
  }
  expect(kaputt, `Überlappungen:\n${kaputt.join('\n')}`).toEqual([]);
});

/*
  Der ungünstigste Fall: zwei Drucker, dann steht zusätzlich die Auswahl in der
  Leiste. Genau der fehlte, als die Münzanzeige um Phase und Herzen wuchs – mit
  nur einem Drucker blieb alles grün, mit zweien überlappte es ab 1345px.
*/
test('auch mit zwei Druckern bleibt die Leiste frei', async ({ page }) => {
  await grundaufbau(page, ['DYMO Küche', 'DYMO Bar']);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  await expect(page.locator('.drucker-wahl')).toBeVisible();

  const kaputt = [];
  for (const breite of BREITEN) {
    await page.setViewportSize({ width: breite, height: 800 });
    await page.waitForTimeout(120);
    const treffer = await ueberlappungen(page, SCHWEBEND);
    if (treffer.length) kaputt.push(`${breite}px: ${treffer.join(', ')}`);
  }
  expect(kaputt, `Überlappungen:\n${kaputt.join('\n')}`).toEqual([]);
});

/*
  Der eigentliche Beweis: nicht "bei diesen Breiten passt es zufällig", sondern
  "die Leiste weicht aus, egal wie breit die Münzanzeige wird". Auf dem
  Testrechner der CI war sie durch anderes Schriftrendering breiter als lokal –
  feste Pixelschwellen sind daran gescheitert.
*/
test('die Leiste weicht auch einer ungewöhnlich breiten Münzanzeige aus', async ({ page }) => {
  await grundaufbau(page, ['DYMO Küche', 'DYMO Bar']);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');

  const kaputt = [];
  for (const zusatz of [0, 120, 260, 420]) {
    await page.evaluate((px) => {
      const el = document.querySelector('.coin-counter');
      el.style.minWidth = px ? `${el.getBoundingClientRect().width + px}px` : '';
    }, zusatz);
    for (const breite of [1920, 1440, 1280, 1100]) {
      await page.setViewportSize({ width: breite, height: 800 });
      await page.waitForTimeout(150);
      const treffer = await ueberlappungen(page, SCHWEBEND);
      if (treffer.length) kaputt.push(`+${zusatz}px bei ${breite}px: ${treffer.join(', ')}`);
    }
  }
  expect(kaputt, `Überlappungen:\n${kaputt.join('\n')}`).toEqual([]);
});
