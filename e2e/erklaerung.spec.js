import { test, expect, grundaufbau, menuepunkt } from './hilfen.js';
import { FREUNDSCHAFT_TAG } from '../src/cat/wachstum.js';
import { DECAY_PER_HOUR } from '../src/cat/needs.js';

/*
  Die Statusleiste zeigt sechs Zahlen, deren Bedeutung nirgends stand –
  "bei den Herzen hab ich im Moment gar keine Ahnung". Ein Klick auf die
  Leiste erklärt sie.
*/
const mitStand = async (page, werte = {}) => {
  await grundaufbau(page);
  await page.addInitScript((w) => {
    try { for (const [k, v] of Object.entries(w)) localStorage.setItem(k, String(v)); } catch { /* gesperrt */ }
  }, {
    cat_coinCount: 900, cat_coinPeak: 1410, cat_lastSeen: Date.now(), cat_fwDone: '1',
    cat_hunger: 72, cat_thirst: 64, cat_freude: 55, ...werte,
  });
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
};

test('ein Klick auf die Statusleiste erklärt sie', async ({ page }) => {
  await mitStand(page);
  await expect(page.locator('.erklaerung')).toHaveCount(0);
  await page.locator('.pet-leiste').click();
  await expect(page.locator('.erklaerung')).toBeVisible();
  await page.locator('.erklaerung button', { hasText: 'Schließen' }).click();
  await expect(page.locator('.erklaerung')).toHaveCount(0);
});

test('die Herzen werden als Freundschaft erklärt und von der Phase getrennt', async ({ page }) => {
  await mitStand(page, { cat_gepflegteTage: '4', cat_freundschaft: '42' });
  await page.locator('.pet-leiste').click();
  const panel = page.locator('.erklaerung');

  await expect(panel).toContainText('zwei verschiedene Dinge');
  await expect(panel, 'der eigene Stand muss dastehen, nicht nur die Regel')
    .toContainText(`${42 + FREUNDSCHAFT_TAG} von 100`);
  await expect(panel).toContainText('fällt nie');
  await expect(panel).toContainText('gepflegte Tage');
  // Und wie man sie hebt
  await expect(panel).toContainText('Gestreichelt');
});

test('die Erklärung hebt hervor, was gerade zutrifft', async ({ page }) => {
  // Hunger und Durst über 70 und hohe Zufriedenheit: glücklich
  await mitStand(page, { cat_hunger: 92, cat_thirst: 90, cat_freude: 88 });
  await page.locator('.pet-leiste').click();
  await expect(page.locator('.erklaerung .erk-liste li.jetzt').first()).toContainText('glücklich');
});

test('die Zahlen stammen aus den Regeln, nicht aus dem Text', async ({ page }) => {
  await mitStand(page);
  await page.locator('.pet-leiste').click();
  // Ändert sich die Verfallsrate im Code, muss die Hilfe mitgehen
  await expect(page.locator('.erklaerung')).toContainText(`${DECAY_PER_HOUR} % je Stunde`);
});

test('gekaufte Ausstattung taucht in der Erklärung auf', async ({ page }) => {
  await mitStand(page, { cat_besitz: JSON.stringify(['kratzbaum']) });
  await page.locator('.pet-leiste').click();
  const panel = page.locator('.erklaerung');
  await expect(panel).toContainText('Kratzbaum');
  await expect(panel).toContainText('fällt fast ein Drittel langsamer');
});

test('ohne Ausstattung sagt die Erklärung genau das', async ({ page }) => {
  await mitStand(page);
  await page.locator('.pet-leiste').click();
  await expect(page.locator('.erklaerung')).toContainText('Bisher ist nichts davon');
});

test('die Erklärung verdeckt das Gimmick-Menü nicht doppelt', async ({ page }) => {
  await mitStand(page);
  (await menuepunkt(page, /Leckerlis/)).waitFor();
  await page.locator('.pet-leiste').click();
  // Beide Ebenen liegen an derselben Stelle – es darf nur eine offen sein
  await expect(page.locator('.gimmick-panel')).toHaveCount(1);
});
