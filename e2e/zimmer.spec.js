import { test, expect, grundaufbau, warteAufDrucke } from './hilfen.js';

/*
  Katzenzimmer, Etappe 1 – hinter dem Schalter ?zimmer.

  Das Wichtigste zuerst: ohne Schalter bleibt die Küche, wie sie ist, und mit
  Schalter druckt sie genauso. Das Zimmer ist Spielerei; der Etikettendruck
  ist die Arbeit.
*/
const oeffnen = async (page, pfad, werte = {}) => {
  await grundaufbau(page);
  await page.addInitScript((w) => {
    try { for (const [k, v] of Object.entries(w)) localStorage.setItem(k, String(v)); } catch { /* gesperrt */ }
  }, { cat_coinCount: 500, cat_coinPeak: 1410, cat_lastSeen: Date.now(), cat_fwDone: '1', cat_hunger: 80, cat_thirst: 80, ...werte });
  await page.goto(pfad);
  await page.waitForSelector('.status-indicator .online');
};

test('ohne Schalter: alte Katze, keine Karte', async ({ page }) => {
  await oeffnen(page, '/');
  await expect(page.locator('.cat-sprite')).toHaveCount(1);
  await expect(page.locator('.kuechen-karte')).toHaveCount(0);
});

test('mit Schalter: Karte statt Katze, nichts über den Etikettenknöpfen', async ({ page }) => {
  await oeffnen(page, '/?zimmer');
  await expect(page.locator('.kuechen-karte')).toBeVisible();
  await expect(page.locator('.cat-sprite')).toHaveCount(0);
  await expect(page.locator('.kuechen-karte')).toContainText('Mails');
  await expect(page.locator('.kuechen-karte')).toContainText('500');
});

test('mit Schalter druckt die Küche wie immer', async ({ page }) => {
  await oeffnen(page, '/?zimmer');
  await page.getByRole('button', { name: /^Steak/ }).first().click();
  expect((await warteAufDrucke(page, 1))[0].felder.Name).toBe('Steak');
});

test('die Karte zeigt, was ihr fehlt', async ({ page }) => {
  await oeffnen(page, '/?zimmer', { cat_thirst: 20 });
  await expect(page.locator('.kuechen-karte')).toContainText('hat Durst');
  await expect(page.locator('.kuechen-karte-punkt')).toBeVisible();
});

test('Zimmer öffnen, Napf füllen, zurück in die Küche', async ({ page }) => {
  await oeffnen(page, '/?zimmer', { zimmer_napf: 10 });
  await page.locator('.kuechen-karte').click();
  await expect(page.locator('.zimmer-szene')).toBeVisible();
  await expect(page.locator('.zimmer-name')).toContainText('Mails');

  await page.locator('.zimmer-menue').getByRole('button', { name: /Füttern/ }).click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 10 % voll');
  // Trockenfutter: 3 Münzen, +20 in den Napf
  await page.locator('.zimmer-karte', { hasText: 'Trockenfutter' }).locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 30 % voll');
  await expect(page.locator('.zimmer-geld')).toContainText('497');

  await page.locator('.zimmer-blatt-zu').click();
  await page.getByRole('button', { name: '← Küche' }).click();
  await expect(page.locator('.zimmer')).toHaveCount(0);
  await expect(page.locator('.kuechen-karte')).toContainText('497');
});

test('voller Napf lässt sich nicht weiter füllen', async ({ page }) => {
  await oeffnen(page, '/?zimmer', { zimmer_napf: 100 });
  await page.locator('.kuechen-karte').click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Füttern/ }).click();
  await expect(page.locator('.zimmer-karte', { hasText: 'Trockenfutter' }).locator('.zimmer-preis')).toBeDisabled();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf ist voll');
});

test('gekaufte Ausstattung steht im Zimmer', async ({ page }) => {
  await oeffnen(page, '/?zimmer', { cat_besitz: JSON.stringify(['kratzbaum', 'trinkbrunnen']) });
  await page.locator('.kuechen-karte').click();
  await expect(page.locator('[data-moebel="kratzbaum"]')).toHaveCount(1);
  await expect(page.locator('[data-moebel="trinkbrunnen"]')).toHaveCount(1);
  await expect(page.locator('[data-moebel="wassernapf"]')).toHaveCount(0);
  await expect(page.locator('[data-moebel="kuschelhoehle"]')).toHaveCount(0);
});
