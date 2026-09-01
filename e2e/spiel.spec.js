import { test, expect, dymoFaelschen, echtesDymoBlocken, menuepunkt, spielstand, STAND_SATT } from './hilfen.js';
import { DECAY_PER_HOUR } from '../src/cat/needs.js';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const mitStand = async (page, werte) => {
  await echtesDymoBlocken(page);
  await page.addInitScript(dymoFaelschen(), [['DYMO Küche'], true, PNG]);
  await page.addInitScript(spielstand(), { ...STAND_SATT, ...werte });
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online', { timeout: 15_000 });
};

test('eine Währung, kein zweites Konto mehr', async ({ page }) => {
  await mitStand(page, { cat_coinCount: 1410 });
  await expect(page.locator('.coin-num')).toHaveText('1410');
  expect(await page.locator('.coin-wallet').count()).toBe(0);
});

test('Hunger und Durst bestimmen den Zustand', async ({ page }) => {
  await mitStand(page, { cat_hunger: 95, cat_thirst: 95, cat_freude: 50 });
  await expect(page.locator('.pet-condition')).toContainText('munter');

  await mitStand(page, { cat_hunger: 8, cat_thirst: 8, cat_freude: 8 });
  await expect(page.locator('.pet-condition')).toContainText('schwach');
  // Eine schwache Katze wird sichtbar matter und die Werte rot
  expect(await page.locator('.cat-sprite.schwach').count()).toBe(1);
  // Hunger, Durst und Zufriedenheit – seit der Tamagotchi-Erweiterung drei Werte
  expect(await page.locator('.pet-stat.kritisch').count()).toBe(3);
});

test('Ausgeben sperrt keine Freischaltung wieder zu', async ({ page }) => {
  // Kontostand niedrig, Höchststand hoch: die Gimmicks bleiben erreichbar
  await mitStand(page, { cat_coinCount: 20, cat_coinPeak: 1410 });
  await expect(page.locator('.coin-num')).toHaveText('20');
  expect(await page.locator('.gimmick-toggle-inline').count()).toBeGreaterThan(0);
});

test('Abwesenheit zehrt, ist aber gedeckelt', async ({ page }) => {
  const stunden = (h) => Date.now() - h * 3600 * 1000;
  // Aus der Rate abgeleitet statt fest eingetragen: die Rate wurde einmal
  // gesenkt (12 auf 1,2) und dieser Test war die einzige Stelle, die es
  // nicht mitbekam.
  await mitStand(page, { cat_hunger: 100, cat_thirst: 100, cat_lastSeen: stunden(10) });
  const nachKurz = await page.evaluate(() => Number(localStorage.getItem('cat_hunger')));
  const erwartet = 100 - 10 * DECAY_PER_HOUR;
  expect(nachKurz).toBeGreaterThan(erwartet - 1);
  expect(nachKurz).toBeLessThan(erwartet + 1);

  await mitStand(page, { cat_hunger: 100, cat_thirst: 100, cat_lastSeen: stunden(30 * 24) });
  // Nach dem Wochenende soll sie nicht völlig ausgehungert begrüssen
  expect(await page.evaluate(() => Number(localStorage.getItem('cat_hunger')))).toBe(75);
});

test('das Hütchenspiel bucht den Einsatz ab und zahlt bei Treffer aus', async ({ page }) => {
  await mitStand(page, { cat_coinCount: 500, cat_shellStreak: 0 });
  const stand = () => page.locator('.coin-num').innerText().then(Number);

  const vor = await stand();
  (await menuepunkt(page, /Hütchenspiel/)).click();
  await expect(page.locator('.shell-board')).toBeVisible();
  await expect.poll(stand, { timeout: 5000 }).toBe(vor - 5);

  await page.waitForSelector('.cup:not([disabled])', { timeout: 20_000 });
  await page.locator('.cup').first().click();
  await expect(page.locator('.shell-msg')).not.toBeEmpty();

  const text = await page.locator('.shell-msg').innerText();
  const nach = await stand();
  // Treffer zahlt 15 (drei Becher), Fehlgriff gar nichts
  expect(nach).toBe(/Richtig/.test(text) ? vor - 5 + 15 : vor - 5);
});

test('bei zu wenig Münzen startet das Spiel gar nicht', async ({ page }) => {
  await mitStand(page, { cat_coinCount: 3 });
  const knopf = await menuepunkt(page, /Hütchenspiel/);
  await expect(knopf).toContainText('5');
  await knopf.click();
  await page.waitForTimeout(600);
  expect(await page.locator('.shell-board').count()).toBe(0);
  await expect(page.locator('.coin-num')).toHaveText('3');
});
