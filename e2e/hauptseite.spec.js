import { test, expect, grundaufbau } from './hilfen.js';
import { DECAY_PER_HOUR } from '../src/cat/needs.js';

/*
  Aus den Tests des alten Spiels übernommen (Etappe 8, 2026-10-06): was dort
  geprüft wurde und im neuen Zimmer weiterlebt – Kopfleiste ohne
  Überlappungen, Hütchenspiel, Abwesenheit. Die alte Oberfläche selbst
  (Statusleiste, Gimmick-Menü, Spielzeug-Overlay) gibt es nicht mehr.
*/

/* Was in der Kopfleiste nebeneinander Platz finden muss. */
const KOPF = ['.kuechen-karte', '.kuechen-katze', '.status-indicator', '.edit-toggle', '.drucker-wahl',
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

/*
  Nach setViewportSize liefert Headless-Chromium Resize-Ereignis und
  ResizeObserver manchmal erst später – feste 150 ms reichten nicht (gemessen:
  bei 1201 und 1440 kam keins rechtzeitig). Auf dem Gerät kommen beide. Also
  pro Breite warten, bis sich die Seite eingeschwungen hat.
*/
const breiteSetzen = async (page, breite) => {
  await page.setViewportSize({ width: breite, height: 800 });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(200);
};

const laden = async (page, drucker = ['DYMO Küche'], stand = {}) => {
  await grundaufbau(page, drucker);
  await page.addInitScript((v) => {
    try { for (const [k, w] of Object.entries(v)) localStorage.setItem(k, String(w)); } catch { /* gesperrt */ }
  }, { cat_fwDone: '1', zimmer_herzen_gesehen: 5, ...stand });
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
};

/*
  Die Projekte decken nur 1024 und 1920 ab. Als die Münzanzeige wuchs,
  überlappte es bei 1280 und 1201 – beide Projektbreiten blieben grün. Deshalb
  ausdrücklich über die Zwischenbreiten, mit einem und mit zwei Druckern.
*/
const BREITEN = [1920, 1600, 1440, 1401, 1366, 1280, 1201, 1100, 1024, 900, 820, 768];

for (const drucker of [['DYMO Küche'], ['DYMO Küche', 'DYMO Bar']]) {
  test(`Kopfleiste bleibt über alle Breiten frei (${drucker.length} Drucker)`, async ({ page }) => {
    await laden(page, drucker);
    const kaputt = [];
    for (const breite of BREITEN) {
      await breiteSetzen(page, breite);
      const treffer = await ueberlappungen(page, KOPF);
      if (treffer.length) kaputt.push(`${breite}px: ${treffer.join(', ')}`);
    }
    expect(kaputt, `Überlappungen:\n${kaputt.join('\n')}`).toEqual([]);
  });
}

test('Kopfleiste: auch mit langem Zustandstext der Karte bleibt alles frei', async ({ page }) => {
  // Häufchen + Geschenk: der längste Text, die breiteste Karte
  await laden(page, ['DYMO Küche', 'DYMO Bar'], {
    zimmer_klo: JSON.stringify({ letzterGang: Date.now() - 20 * 3_600_000, klo: 0, haeufchen: [], putzen: { tag: '', summe: 0 } }),
  });
  const kaputt = [];
  for (const breite of [1920, 1280, 1024, 820]) {
    await breiteSetzen(page, breite);
    const treffer = await ueberlappungen(page, KOPF);
    if (treffer.length) kaputt.push(`${breite}px: ${treffer.join(', ')}`);
  }
  expect(kaputt, `Überlappungen:\n${kaputt.join('\n')}`).toEqual([]);
});

const huetchenspiel = async (page, stand) => {
  await laden(page, ['DYMO Küche'], { cat_coinCount: 500, cat_shellStreak: 0, zimmer_geschenk: 'x', ...stand });
  await page.locator('.kuechen-karte').click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
  return page.locator('.zimmer-karte', { hasText: 'Hütchenspiel' }).locator('.zimmer-preis');
};
const muenzen = (page) => page.locator('.zimmer-geld').innerText().then((t) => Number(t.replace(/\D/g, '')));

test('Hütchenspiel: Einsatz geht ab, Treffer zahlt 15', async ({ page }) => {
  // Geschenk heute schon abgeholt, damit es den Münzstand nicht verändert
  await (await huetchenspiel(page, {})).click();
  await expect(page.locator('.shell-board')).toBeVisible();
  await expect.poll(() => muenzen(page), { timeout: 5000 }).toBe(495);

  await page.waitForSelector('.cup:not([disabled])', { timeout: 20_000 });
  await page.locator('.cup').first().click();
  await expect(page.locator('.shell-msg')).not.toBeEmpty();
  const text = await page.locator('.shell-msg').innerText();
  expect(await muenzen(page)).toBe(/Richtig/.test(text) ? 495 + 15 : 495);
});

test('Hütchenspiel: mit zu wenig Münzen lässt es sich nicht starten', async ({ page }) => {
  const knopf = await huetchenspiel(page, { cat_coinCount: 3 });
  await expect(knopf).toBeDisabled();
});

test('Hütchenspiel steht mittig, beim Merken ist die Münze wirklich zu sehen', async ({ page }) => {
  await (await huetchenspiel(page, {})).click();
  await expect(page.locator('.shell-board')).toBeVisible();
  const mass = await page.evaluate(() => {
    const b = document.querySelector('.shell-board').getBoundingClientRect();
    return { x: Math.abs(b.x + b.width / 2 - innerWidth / 2), y: Math.abs(b.y + b.height / 2 - innerHeight / 2) };
  });
  expect(mass.x).toBeLessThan(2);
  expect(mass.y).toBeLessThan(2);

  await page.waitForSelector('.shell-coin');
  await page.waitForTimeout(350); // Becher hebt sich
  const sicht = await page.evaluate(() => {
    const m = document.querySelector('.shell-coin').getBoundingClientRect();
    const deckel = document.querySelector('.cup.lifted .cup-top').getBoundingClientRect();
    return { frei: m.top >= deckel.bottom - 1, groesse: Math.round(m.width) };
  });
  expect(sicht.frei).toBe(true);
  expect(sicht.groesse).toBeGreaterThan(30);
});

test('Abwesenheit zehrt, ist aber gedeckelt', async ({ page }) => {
  const stunden = (h) => Date.now() - h * 3_600_000;
  // Aus der Rate abgeleitet statt fest eingetragen – die Rate wurde schon einmal gesenkt
  await laden(page, ['DYMO Küche'], { cat_hunger: 100, cat_thirst: 100, cat_lastSeen: stunden(10) });
  const nachKurz = await page.evaluate(() => Number(localStorage.getItem('cat_hunger')));
  expect(nachKurz).toBeGreaterThan(100 - 10 * DECAY_PER_HOUR - 1);
  expect(nachKurz).toBeLessThan(100 - 10 * DECAY_PER_HOUR + 1);
});

test('Abwesenheit: nach Wochen begrüsst sie nicht völlig ausgehungert', async ({ page }) => {
  await laden(page, ['DYMO Küche'], { cat_hunger: 100, cat_thirst: 100, cat_lastSeen: Date.now() - 30 * 24 * 3_600_000 });
  expect(await page.evaluate(() => Number(localStorage.getItem('cat_hunger')))).toBe(75);
});

test('frisches Gerät: satte Katze, keine Fehlermeldung, Katze in der Kopfleiste', async ({ page }) => {
  await grundaufbau(page);
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* gesperrt */ } });
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(String(e)));
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  await expect(page.locator('.kuechen-karte')).not.toContainText(/Hunger|Durst|krank/);
  await expect(page.locator('.app-bar .kuechen-katze')).toBeVisible();
  expect(fehler).toEqual([]);
});
