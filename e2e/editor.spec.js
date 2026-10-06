import { test, expect } from './hilfen.js';

test.beforeEach(async ({ seite }) => {
  await seite.click('.edit-toggle');
  await expect(seite.locator('.editor-panel')).toBeVisible();
});

test('Löschen fragt im Klartext nach, Abbrechen löscht nicht', async ({ seite }) => {
  const gruppe = seite.locator('.editor-group').first();
  const vorher = await gruppe.locator('.editor-entry').count();

  await gruppe.locator('.editor-entry').first().getByRole('button', { name: /löschen/i }).click();
  // Früher wechselte nur das Icon von 🗑 auf ✓ – das hat niemand als
  // "zweiter Klick nötig" gelesen und galt als kaputt.
  await expect(gruppe.locator('.editor-confirm')).toContainText('löschen?');
  await expect(gruppe.getByRole('button', { name: 'Ja, löschen' })).toBeVisible();

  await gruppe.getByRole('button', { name: 'Abbrechen' }).click();
  expect(await gruppe.locator('.editor-entry').count()).toBe(vorher);

  await gruppe.locator('.editor-entry').first().getByRole('button', { name: /löschen/i }).click();
  await gruppe.getByRole('button', { name: 'Ja, löschen' }).click();
  expect(await gruppe.locator('.editor-entry').count()).toBe(vorher - 1);
});

test('Symbol wird ausgewählt statt getippt', async ({ seite }) => {
  const gruppe = seite.locator('.editor-group').first();
  const knopf = gruppe.locator('.icon-picker-trigger');
  const vorher = await knopf.innerText();

  await knopf.click();
  expect(await seite.locator('.icon-picker-choice').count()).toBeGreaterThan(30);
  await seite.locator('.icon-picker-choice').nth(9).click();
  await expect(seite.locator('.icon-picker-popover')).toHaveCount(0);
  expect(await knopf.innerText()).not.toBe(vorher);

  await knopf.click();
  await seite.locator('.icon-picker-custom input').fill('🦆');
  await seite.getByRole('button', { name: 'Übernehmen' }).click();
  expect(await knopf.innerText()).toBe('🦆');
});

test('Änderungen überleben einen Reload', async ({ seite }) => {
  const gruppe = seite.locator('.editor-group').first();
  await gruppe.getByPlaceholder('Neues Etikett…').fill('Lammkarree');
  await gruppe.getByRole('button', { name: /Hinzufügen/ }).click();
  await gruppe.locator('.editor-entry input').first().fill('Rumpsteak');
  await seite.getByRole('button', { name: 'Fertig' }).click();

  await expect(seite.getByRole('button', { name: /^Rumpsteak/ })).toBeVisible();
  await seite.reload();
  await seite.waitForSelector('.status-indicator .online', { timeout: 15_000 });
  await expect(seite.getByRole('button', { name: /^Rumpsteak/ })).toBeVisible();
  await expect(seite.getByRole('button', { name: /^Lammkarree/ })).toBeVisible();
});

test('kaputte gespeicherte Daten werfen die App nicht um', async ({ seite }) => {
  await seite.getByRole('button', { name: 'Fertig' }).click();
  await seite.evaluate(() => localStorage.setItem('etikett_gruppen_v1', '{ kaputt'));
  await seite.reload();
  await seite.waitForSelector('.status-indicator .online', { timeout: 15_000 });
  // Rückfall auf den Auslieferungszustand statt weisser Seite
  expect(await seite.locator('.button-group').count()).toBe(6);
});

test('Sicherung lässt sich herunterladen', async ({ seite }) => {
  const [datei] = await Promise.all([
    seite.waitForEvent('download'),
    seite.getByRole('button', { name: /Sichern/ }).click(),
  ]);
  expect(datei.suggestedFilename()).toMatch(/^etiketten-\d{4}-\d{2}-\d{2}\.json$/);
});

/*
  Namen werden getippt, nicht eingefügt. Die E2E-Tests benutzten bisher
  fill(), das den Wert in einem Rutsch setzt – dadurch blieb monatelang
  unentdeckt, dass jedes Leerzeichen sofort weggetrimmt wurde: getippt
  "Rote Beete", im Feld stand "RoteBeete". Deshalb hier Zeichen für Zeichen.
*/
test('Namen mit Leerzeichen lassen sich Zeichen für Zeichen tippen', async ({ seite }) => {
  const feld = seite.locator('.editor-group-name').first();
  await feld.click();
  await seite.keyboard.press('Control+a');
  await seite.keyboard.type('Rote Beete', { delay: 30 });
  await expect(feld).toHaveValue('Rote Beete');

  // Übernommen wird beim Verlassen des Feldes – und es überlebt den Reload
  await feld.press('Tab');
  await seite.reload();
  await seite.waitForSelector('.status-indicator .online');
  await seite.click('.edit-toggle');
  await expect(seite.locator('.editor-group-name').first()).toHaveValue('Rote Beete');
});

test('ein Etikett lässt sich komplett neu schreiben', async ({ seite }) => {
  const feld = seite.locator('.editor-entry input').first();
  await feld.click();
  await seite.keyboard.press('Control+a');
  await seite.keyboard.press('Backspace');
  // Das leere Zwischenstadium muss erlaubt sein, sonst kommt man nie weiter
  await expect(feld).toHaveValue('');
  await seite.keyboard.type('Kalbsbäckchen geschmort', { delay: 20 });
  await feld.press('Enter');
  await expect(feld).toHaveValue('Kalbsbäckchen geschmort');
});

test('leer gelassener Name fällt auf den alten zurück, nichts geht verloren', async ({ seite }) => {
  const feld = seite.locator('.editor-entry input').first();
  const vorher = await feld.inputValue();
  await feld.click();
  await seite.keyboard.press('Control+a');
  await seite.keyboard.press('Backspace');
  await feld.press('Tab');
  await expect(feld).toHaveValue(vorher);
});

test('Escape verwirft die Änderung', async ({ seite }) => {
  const feld = seite.locator('.editor-group-name').first();
  const vorher = await feld.inputValue();
  await feld.click();
  await seite.keyboard.type(' Probe');
  await feld.press('Escape');
  await expect(feld).toHaveValue(vorher);
});
