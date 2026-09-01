import { test, expect, grundaufbau, menuepunkt } from './hilfen.js';
import { ALLE } from '../src/cat/laden.js';

const mitMuenzen = async (page, stand, weitere = {}) => {
  await grundaufbau(page);
  await page.addInitScript(([n, extra]) => {
    try {
      localStorage.setItem('cat_coinCount', String(n));
      localStorage.setItem('cat_coinPeak', '1410');
      for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, String(v));
      // Nicht aufräumen: das Skript läuft auch beim Reload und würde den
      // gerade getätigten Kauf wieder löschen. Jeder Test hat ohnehin ein
      // frisches Profil.
    } catch { /* gesperrt */ }
  }, [stand, weitere]);
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
  // Aus dem Katalog abgeleitet: eine feste Zahl hier veraltet beim ersten
  // neuen Artikel und behauptet dann etwas Falsches.
  await expect(page.locator('.laden-stand')).toContainText(`von ${ALLE.length}`);
});

// ── Ausstattung: die Artikel, die wirklich etwas tun ────────────────────────

test('Ausstattung erklärt ihre Wirkung, statt nur einen Preis zu zeigen', async ({ page }) => {
  await mitMuenzen(page, 3000);
  const zeile = page.locator('.laden-zeile', { hasText: 'Futterautomat' });
  await expect(zeile).toContainText('Der Hunger fällt ein Viertel langsamer');
  // Ohne diesen Satz wäre der Unterschied zu einem Halsband nicht erkennbar
  await expect(page.locator('.laden-zeile', { hasText: 'Kuschelhöhle' }))
    .toContainText('Nachts erholt sie sich');
});

test('gekaufte Ausstattung läuft von selbst und wird nicht angelegt', async ({ page }) => {
  await mitMuenzen(page, 3000);
  const zeile = page.locator('.laden-zeile', { hasText: 'Kratzbaum' });
  await zeile.locator('.laden-knopf').click();

  await expect(stand(page)).resolves.toBe(3000 - 1200);
  // Kein "anlegen"-Knopf: ein Kratzbaum steht im Raum, man zieht ihn nicht an
  await expect(zeile.locator('.laden-knopf')).toHaveCount(0);
  await expect(zeile.locator('.laden-aktiv')).toHaveText(/aktiv/);

  await page.reload();
  await page.waitForSelector('.status-indicator .online');
  (await menuepunkt(page, /Katzenladen/)).click();
  await expect(page.locator('.laden-zeile', { hasText: 'Kratzbaum' }).locator('.laden-aktiv'))
    .toBeVisible();
});

test('die Glückspfote bringt bei jedem Fund eine Münze mehr', async ({ page }) => {
  // Nicht auf genau 0 herunterkaufen: unter einer Münze verschwindet die
  // ganze Anzeige, und der Test hätte nichts mehr zum Ablesen.
  /*
    Zustand festnageln: satt und zufrieden ist die Katze "glücklich" und
    verdoppelt jeden Fund ohnehin. Dann wäre nicht zu erkennen, ob die
    zusätzliche Münze von der Pfote kommt oder von der guten Laune.
    Mit 60/60/50 steht sie auf "zufrieden", Faktor genau 1.
  */
  await mitMuenzen(page, 2700, { cat_hunger: 60, cat_thirst: 60, cat_freude: 50 });
  await page.locator('.laden-zeile', { hasText: 'Glückspfote' }).locator('.laden-knopf').click();
  await expect(stand(page)).resolves.toBe(100);
  await page.locator('.gimmick-panel.laden button', { hasText: 'Schließen' }).click();

  // Leckerlis werfen und eines anklicken: normal 1 Münze, mit Pfote 2
  await (await menuepunkt(page, /Leckerlis/)).click();
  const leckerli = page.locator('.treat').first();
  await leckerli.waitFor({ timeout: 5000 });
  // Leckerlis fallen von oben herein und starten ausserhalb des Bildes;
  // ein echter Klick scheitert daran. Das Ereignis direkt zustellen.
  await leckerli.dispatchEvent('click');
  await expect(stand(page)).resolves.toBe(102);
});
