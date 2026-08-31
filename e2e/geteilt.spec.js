import { test, expect, grundaufbau } from './hilfen.js';

/*
  Der Vorschau-Server liefert kein /daten/ – die Antworten werden deshalb
  abgefangen. Das prüft genau das Verhalten der App, unabhängig von nginx.
*/
const serverMit = (page, inhalt) => {
  const ablage = { wert: inhalt, puts: 0 };
  page.route('**/daten/etiketten.json', async (route) => {
    if (route.request().method() === 'PUT') {
      ablage.puts += 1;
      ablage.wert = route.request().postData();
      return route.fulfill({ status: 201 });
    }
    return ablage.wert === null
      ? route.fulfill({ status: 204 })
      : route.fulfill({ status: 200, contentType: 'application/json', body: ablage.wert });
  });
  return ablage;
};

const serverWeg = (page) => page.route('**/daten/etiketten.json', (route) => route.abort('failed'));

const liste = (groups) => JSON.stringify({
  format: 'labelkitchen-etiketten', version: 1, exportedAt: new Date().toISOString(), groups,
});

test('leerer Server bekommt den lokalen Stand als Startpunkt', async ({ page }) => {
  const ablage = serverMit(page, null);
  await grundaufbau(page);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  await page.click('.edit-toggle');
  await expect(page.locator('.editor-speicher.geteilt')).toContainText('alle Geräte');
  expect(ablage.puts).toBe(1);
  expect(JSON.parse(ablage.wert).groups.length).toBe(6);
});

test('vorhandene Serverliste gewinnt über den lokalen Stand', async ({ page }) => {
  serverMit(page, liste([
    { id: 'x', name: 'Vom Server', icon: '🌐', entries: [{ name: 'Serverwurst', tage: 4 }] },
  ]));
  await grundaufbau(page);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  await expect(page.getByRole('button', { name: /^Serverwurst/ })).toBeVisible();
  expect(await page.locator('.button-group').count()).toBe(1);
  // und liegt danach auch lokal, damit die App ohne Netz weiterarbeitet
  const lokal = await page.evaluate(() => localStorage.getItem('etikett_gruppen_v1'));
  expect(lokal).toContain('Serverwurst');
});

test('Änderung landet auf dem Server', async ({ page }) => {
  const ablage = serverMit(page, null);
  await grundaufbau(page);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  await page.click('.edit-toggle');
  const gruppe = page.locator('.editor-group').first();
  await gruppe.getByPlaceholder('Neues Etikett…').fill('Lammkarree');
  await gruppe.getByRole('button', { name: /Hinzufügen/ }).click();
  await expect.poll(() => ablage.puts).toBeGreaterThan(1);
  expect(ablage.wert).toContain('Lammkarree');
});

test('ohne Server bleibt die Küche arbeitsfähig und wird gewarnt', async ({ page }) => {
  await serverWeg(page);
  await grundaufbau(page);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  // Etiketten sind trotzdem da
  expect(await page.locator('.button-group').count()).toBe(6);

  await page.click('.edit-toggle');
  await expect(page.locator('.editor-speicher.nurLokal')).toContainText('nur auf diesem Gerät');

  const gruppe = page.locator('.editor-group').first();
  await gruppe.getByPlaceholder('Neues Etikett…').fill('Notfalletikett');
  await gruppe.getByRole('button', { name: /Hinzufügen/ }).click();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('button', { name: /^Notfalletikett/ })).toBeVisible();

  // und überlebt auch den Reload lokal
  await page.reload();
  await page.waitForSelector('.status-indicator .online');
  await expect(page.getByRole('button', { name: /^Notfalletikett/ })).toBeVisible();
});

test('kaputte Serverdaten werfen die App nicht um', async ({ page }) => {
  serverMit(page, '{ kaputt');
  await grundaufbau(page);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
  expect(await page.locator('.button-group').count()).toBe(6);
  await page.click('.edit-toggle');
  await expect(page.locator('.editor-speicher.nurLokal')).toBeVisible();
});
