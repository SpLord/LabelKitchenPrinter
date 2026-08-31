import { test, expect, grundaufbau, menuepunkt } from './hilfen.js';

const mitMuenzen = async (page, stand) => {
  await grundaufbau(page);
  await page.addInitScript((n) => {
    try {
      localStorage.setItem('cat_coinCount', String(n));
      localStorage.setItem('cat_coinPeak', '1410');
      // Nicht aufräumen: das Skript läuft auch beim Reload und würde den
      // gerade getätigten Kauf wieder löschen. Jeder Test hat ohnehin ein
      // frisches Profil.
    } catch { /* gesperrt */ }
  }, stand);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  (await menuepunkt(page, /Katzenladen/)).click();
  await expect(page.locator('.gimmick-panel.laden')).toBeVisible();
};

const stand = (page) => page.locator('.coin-num').innerText().then(Number);

test('zu teure Artikel lassen sich nicht kaufen', async ({ page }) => {
  await mitMuenzen(page, 100);
  const halsband = page.locator('.laden-zeile', { hasText: 'Halsband' }).locator('.laden-knopf');
  await expect(halsband).toBeDisabled();
  await expect(halsband).toHaveText(/250/);
  // Die teuerste Schleife ist damit erst recht ausser Reichweite
  await expect(page.locator('.laden-zeile', { hasText: 'Schleife' }).locator('.laden-knopf')).toBeDisabled();
});

test('Kaufen bucht ab, legt an und bleibt bestehen', async ({ page }) => {
  await mitMuenzen(page, 900);
  const vor = await stand(page);
  await page.locator('.laden-zeile', { hasText: 'Halsband' }).locator('.laden-knopf').click();

  await expect.poll(() => stand(page)).toBe(vor - 250);
  const zeile = page.locator('.laden-zeile', { hasText: 'Halsband' });
  await expect(zeile).toHaveClass(/gekauft/);
  await expect(zeile.locator('.laden-knopf')).toHaveText('✓ angelegt');
  // Das Zubehör wird auch wirklich gezeichnet
  await expect(page.locator('.kz-halsband')).toBeVisible();

  await page.reload();
  await page.waitForSelector('.status-indicator .online');
  await expect(page.locator('.kz-halsband')).toBeVisible();
  await expect.poll(() => stand(page)).toBe(vor - 250);
});

test('Anlegen und Abnehmen kosten nichts', async ({ page }) => {
  await mitMuenzen(page, 900);
  const knopf = page.locator('.laden-zeile', { hasText: 'Halsband' }).locator('.laden-knopf');
  await knopf.click();
  const nachKauf = await stand(page);

  await knopf.click();
  await expect(page.locator('.kz-halsband')).toHaveCount(0);
  await knopf.click();
  await expect(page.locator('.kz-halsband')).toBeVisible();
  expect(await stand(page)).toBe(nachKauf);
});

test('immer nur ein Fell gleichzeitig', async ({ page }) => {
  await mitMuenzen(page, 3000);
  await page.locator('.laden-zeile', { hasText: 'Blau' }).locator('.laden-knopf').click();
  await page.locator('.laden-zeile', { hasText: 'Rosa' }).locator('.laden-knopf').click();
  await expect(page.locator('.laden-zeile', { hasText: 'Rosa' }).locator('.laden-knopf')).toHaveText('✓ angelegt');
  await expect(page.locator('.laden-zeile', { hasText: 'Blau' }).locator('.laden-knopf')).toHaveText('anlegen');
});

test('der Laden reicht weit über den heutigen Stand hinaus', async ({ page }) => {
  await mitMuenzen(page, 1410);
  const gesperrt = await page.locator('.laden-knopf:disabled').count();
  expect(gesperrt).toBeGreaterThan(0);
  await expect(page.locator('.laden-stand')).toContainText('von 12');
});
