import { test, expect, warteAufDrucke } from './hilfen.js';

const heute = () => {
  const jetzt = new Date();
  const grenze = new Date(jetzt);
  grenze.setHours(5, 0, 0, 0);
  if (jetzt >= grenze) return jetzt;
  const vortag = new Date(jetzt);
  vortag.setDate(vortag.getDate() - 1);
  return vortag;
};
const kurz = (d) => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.`;

test('ohne Haltbarkeit bleibt das Etikett wie gewohnt', async ({ seite }) => {
  await seite.getByRole('button', { name: /^Steak/ }).first().click();
  const drucke = await warteAufDrucke(seite, 1);
  expect(drucke[0].felder.Datum).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
  expect(drucke[0].felder.Datum).not.toContain('→');
});

test('mit Haltbarkeit steht das Verwendbar-bis mit auf dem Etikett', async ({ seite }) => {
  await seite.click('.edit-toggle');
  const gruppe = seite.locator('.editor-group').first();
  await gruppe.locator('.haltbar-feld input').first().fill('3');
  await seite.getByRole('button', { name: 'Fertig' }).click();

  // Auf dem Knopf ist die Haltbarkeit ohne Editor ablesbar
  const knopf = seite.getByRole('button', { name: /^Steak/ }).first();
  await expect(knopf.locator('.haltbar-marke')).toHaveText('3 T');

  await knopf.click();
  const drucke = await warteAufDrucke(seite, 1);
  const von = heute();
  const bis = new Date(von.getTime() + 3 * 86400000);
  expect(drucke[0].felder.Datum).toBe(`${kurz(von)} → ${kurz(bis)}`);
});

test('Haltbarkeit überlebt den Reload', async ({ seite }) => {
  await seite.click('.edit-toggle');
  await seite.locator('.editor-group').first().locator('.haltbar-feld input').first().fill('7');
  await seite.getByRole('button', { name: 'Fertig' }).click();
  await seite.reload();
  await seite.waitForSelector('.status-indicator .online');
  await expect(seite.getByRole('button', { name: /^Steak/ }).first().locator('.haltbar-marke')).toHaveText('7 T');
});

test('Unsinn im Feld führt nicht zu Unsinn auf dem Etikett', async ({ seite }) => {
  await seite.click('.edit-toggle');
  const feld = seite.locator('.editor-group').first().locator('.haltbar-feld input').first();
  await feld.fill('-5');
  await seite.getByRole('button', { name: 'Fertig' }).click();
  // Negatives zählt als "keine Haltbarkeit"
  expect(await seite.getByRole('button', { name: /^Steak/ }).first().locator('.haltbar-marke').count()).toBe(0);
  await seite.getByRole('button', { name: /^Steak/ }).first().click();
  const drucke = await warteAufDrucke(seite, 1);
  expect(drucke[0].felder.Datum).not.toContain('→');
});
