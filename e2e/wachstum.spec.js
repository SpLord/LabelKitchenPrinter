import { test, expect, grundaufbau } from './hilfen.js';

const mitWerten = async (page, werte, zeit) => {
  if (zeit) await page.clock.setFixedTime(new Date(zeit));
  await grundaufbau(page);
  await page.addInitScript((w) => {
    try { for (const [k, v] of Object.entries(w)) localStorage.setItem(k, String(v)); } catch { /* gesperrt */ }
  }, { cat_coinCount: 900, cat_coinPeak: 1410, cat_hunger: 90, cat_thirst: 90,
       cat_freude: 70, cat_lastSeen: Date.now(), cat_fwDone: '1', ...werte });
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
};

test('frische Katze ist ein Kitten', async ({ page }) => {
  await mitWerten(page, {}, '2026-08-31T14:00:00');
  await expect(page.locator('.pet-phase')).toContainText('Kitten');
});

test('Phase wächst mit gepflegten Tagen', async ({ page }) => {
  await mitWerten(page, { cat_gepflegteTage: 4, cat_letzterTag: '2026-08-31' }, '2026-08-31T14:00:00');
  await expect(page.locator('.pet-phase')).toContainText('Jungkatze');

  await mitWerten(page, { cat_gepflegteTage: 12, cat_letzterTag: '2026-08-31' }, '2026-08-31T14:00:00');
  await expect(page.locator('.pet-phase')).toContainText('ausgewachsen');
});

test('Kitten sind sichtbar kleiner als ausgewachsene Katzen', async ({ page }) => {
  const groesse = () => page.evaluate(() =>
    Number(getComputedStyle(document.querySelector('.cat-float')).scale) || 1);

  await mitWerten(page, { cat_gepflegteTage: 0, cat_letzterTag: '2026-08-31' }, '2026-08-31T14:00:00');
  const klein = await groesse();

  await mitWerten(page, { cat_gepflegteTage: 20, cat_letzterTag: '2026-08-31' }, '2026-08-31T14:00:00');
  const gross = await groesse();

  expect(klein).toBeLessThan(gross);
  expect(gross).toBeCloseTo(1, 2);
});

test('ein gepflegter Tag zählt genau einmal', async ({ page }) => {
  await mitWerten(page, { cat_gepflegteTage: 2, cat_letzterTag: '2026-08-30' }, '2026-08-31T14:00:00');
  const tage = () => page.evaluate(() => Number(localStorage.getItem('cat_gepflegteTage')));
  await expect.poll(tage).toBe(3);

  await page.reload();
  await page.waitForSelector('.status-indicator .online');
  expect(await tage()).toBe(3);
});

test('ein schlechter Tag kostet nichts, zählt aber auch nicht', async ({ page }) => {
  await mitWerten(page, {
    cat_gepflegteTage: 5, cat_letzterTag: '2026-08-30',
    cat_hunger: 6, cat_thirst: 6, cat_freude: 5,
  }, '2026-08-31T14:00:00');
  await page.waitForTimeout(800);
  // Kein Rückschritt – im Küchendienst wird nicht bestraft
  expect(await page.evaluate(() => Number(localStorage.getItem('cat_gepflegteTage')))).toBe(5);
});

test('Freundschaft wächst beim Streicheln und fällt nie', async ({ page }) => {
  await mitWerten(page, { cat_freundschaft: 30, cat_letzterTag: '2026-08-31' }, '2026-08-31T14:00:00');
  const wert = () => page.evaluate(() => Number(localStorage.getItem('cat_freundschaft')));
  const vor = await wert();
  await page.locator('.cat-sprite').click();
  await expect.poll(wert).toBeGreaterThan(vor);

  await page.reload();
  await page.waitForSelector('.status-indicator .online');
  expect(await wert()).toBeGreaterThanOrEqual(vor);
});

test('Herzen zeigen die Freundschaft', async ({ page }) => {
  await mitWerten(page, { cat_freundschaft: 100, cat_letzterTag: '2026-08-31' }, '2026-08-31T14:00:00');
  const text = await page.locator('.pet-phase').innerText();
  expect((text.match(/❤️/g) || []).length).toBe(5);
  expect((text.match(/🤍/g) || []).length).toBe(0);

  await mitWerten(page, { cat_freundschaft: 0, cat_letzterTag: '2026-08-31' }, '2026-08-31T14:00:00');
  const leer = await page.locator('.pet-phase').innerText();
  expect((leer.match(/🤍/g) || []).length).toBe(5);
});
