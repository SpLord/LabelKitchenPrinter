import { test, expect, grundaufbau, menuepunkt, warteAufDrucke } from './hilfen.js';

const mitZustand = async (page, werte) => {
  await grundaufbau(page);
  await page.addInitScript((w) => {
    try { for (const [k, v] of Object.entries(w)) localStorage.setItem(k, String(v)); } catch { /* gesperrt */ }
  }, { cat_coinCount: 900, cat_coinPeak: 1410, cat_lastSeen: Date.now(), cat_fwDone: '1', ...werte });
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
};

test('Zufriedenheit steht neben Hunger und Durst', async ({ page }) => {
  await mitZustand(page, { cat_hunger: 90, cat_thirst: 90, cat_freude: 70 });
  await expect(page.locator('.pet-stat', { hasText: '💛' })).toContainText('70%');
});

test('satt und zufrieden heisst glücklich', async ({ page }) => {
  await mitZustand(page, { cat_hunger: 95, cat_thirst: 95, cat_freude: 95 });
  await expect(page.locator('.pet-condition')).toContainText('glücklich');
});

test('niedrige Zufriedenheit wird rot markiert', async ({ page }) => {
  await mitZustand(page, { cat_hunger: 90, cat_thirst: 90, cat_freude: 10 });
  await expect(page.locator('.pet-stat.kritisch', { hasText: '💛' })).toBeVisible();
});

test('krank: sichtbar, und Medizin heilt gegen Münzen', async ({ page }) => {
  await mitZustand(page, { cat_hunger: 8, cat_thirst: 8, cat_freude: 50, cat_krank: '1' });
  await expect(page.locator('.pet-condition')).toContainText('krank');
  expect(await page.locator('.cat-sprite.krank').count()).toBe(1);

  const stand = () => page.locator('.coin-num').innerText().then(Number);
  const vor = await stand();
  (await menuepunkt(page, /Medizin/)).click();

  await expect.poll(() => stand()).toBe(vor - 40);
  await expect(page.locator('.pet-condition')).not.toContainText('krank');
  // Medizin füllt auch die Grundbedürfnisse etwas auf
  expect(await page.evaluate(() => Number(localStorage.getItem('cat_hunger')))).toBeGreaterThan(30);
});

test('ohne genug Münzen keine Medizin', async ({ page }) => {
  await mitZustand(page, { cat_coinCount: 10, cat_hunger: 8, cat_thirst: 8, cat_krank: '1' });
  (await menuepunkt(page, /Medizin/)).click();
  await expect(page.locator('.cat-bubble')).toContainText('40');
  await expect(page.locator('.pet-condition')).toContainText('krank');
  await expect(page.locator('.coin-num')).toHaveText('10');
});

test('Streicheln hebt die Zufriedenheit', async ({ page }) => {
  await mitZustand(page, { cat_hunger: 90, cat_thirst: 90, cat_freude: 40 });
  const freude = () => page.evaluate(() => Number(localStorage.getItem('cat_freude')));
  const vor = await freude();
  await page.locator('.cat-sprite').click();
  await expect.poll(freude).toBeGreaterThan(vor);
});

test('kranke Katze sammelt keine Münzen', async ({ page }) => {
  await mitZustand(page, { cat_hunger: 8, cat_thirst: 8, cat_krank: '1' });
  const stand = () => page.locator('.coin-num').innerText().then(Number);
  const vor = await stand();
  // Spielzeug spawnen und der Katze Zeit geben
  await page.mouse.click(700, 700);
  await page.waitForTimeout(2500);
  expect(await stand()).toBe(vor);
});

test('nachts schläft sie und sammelt nichts', async ({ page }) => {
  // Uhr auf 23:30 stellen, bevor die Seite lädt
  await page.clock.setFixedTime(new Date('2026-08-31T23:30:00'));
  await mitZustand(page, { cat_hunger: 95, cat_thirst: 95, cat_freude: 95 });

  await expect(page.locator('.pet-condition')).toContainText('schläft');
  await expect(page.locator('.cat-sprite[data-schlaeft="ja"]')).toHaveCount(1);

  const stand = () => page.locator('.coin-num').innerText().then(Number);
  const vor = await stand();
  await page.mouse.click(700, 700);
  await page.waitForTimeout(2500);
  expect(await stand()).toBe(vor);
});

test('tagsüber ist sie wach', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-31T14:00:00'));
  await mitZustand(page, { cat_hunger: 95, cat_thirst: 95, cat_freude: 95 });
  await expect(page.locator('.pet-condition')).not.toContainText('schläft');
  await expect(page.locator('.cat-sprite[data-schlaeft="nein"]')).toHaveCount(1);
});

test('frisches Gerät startet mit satter Katze, nicht bei null', async ({ page }) => {
  await grundaufbau(page);
  // Bewusst ohne cat_hunger/cat_thirst/cat_freude: das ist der Erstzustand
  await page.addInitScript(() => {
    try { localStorage.setItem('cat_coinCount', '900'); localStorage.setItem('cat_fwDone', '1'); } catch { /* gesperrt */ }
  });
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');

  const werte = await page.evaluate(() => ({
    hunger: Number(localStorage.getItem('cat_hunger')),
    durst: Number(localStorage.getItem('cat_thirst')),
    freude: Number(localStorage.getItem('cat_freude')),
  }));
  expect(werte.hunger).toBeGreaterThan(50);
  expect(werte.durst).toBeGreaterThan(50);
  expect(werte.freude).toBeGreaterThan(50);
  expect(await page.locator('.cat-sprite.schwach').count()).toBe(0);
});

/*
  BEWUSST NICHT ALS TEST: "Fangen hebt die Zufriedenheit".

  Die Katze muss dafür das Spielzeug tatsächlich erreichen, und die
  Verfolgung läuft im Headless-Browser stark gedrosselt – der Test bestand mal
  und fiel mal durch, ohne dass sich am Code etwas änderte. Ein flackernder
  Test ist schlimmer als keiner: er untergräbt das Vertrauen in die ganze
  Suite. Die Verdrahtung (showCelebrate ruft erfreuen und naeherKommen) ist
  von Hand am laufenden System bestätigt worden; die Rechenregel dahinter
  deckt src/cat/tamagotchi.test.mjs ab.
*/

/*
  Füttern hatte schon einmal einen bösen Fehler: der Platzieren-Klick wurde
  über die ganze Seite abgefangen und innerhalb des Hauptbereichs verworfen –
  auf dem Tablet war das der grösste Teil der Fläche. Es liess sich weder
  füttern noch sonst etwas bedienen. Diese Prüfung deckt genau das ab: die
  Ebene nimmt den Klick an, stellt den Napf hin und gibt die Bedienung frei.
*/
test('Füttern stellt den Napf hin und blockiert die Bedienung nicht', async ({ page }) => {
  await mitZustand(page, { cat_hunger: 30, cat_thirst: 80 });

  await (await menuepunkt(page, /Wasser/)).click();

  const ebene = page.locator('.place-overlay');
  await expect(ebene, 'die Platzieren-Ebene muss aufgehen').toBeVisible();

  // Mitten in den Hauptbereich tippen – genau dort ging es früher verloren
  const feld = await page.locator('.main-layout').boundingBox();
  await page.mouse.click(feld.x + feld.width / 2, feld.y + feld.height / 2);

  await expect(page.locator('.placed-item'), 'der Napf muss stehen').toHaveCount(1);
  await expect(ebene, 'die Ebene muss wieder verschwinden').toHaveCount(0);

  // Und die Küche muss danach weiterarbeiten können
  await page.getByRole('button', { name: /^Steak/ }).first().click();
  expect((await warteAufDrucke(page, 1)).length).toBe(1);
});
