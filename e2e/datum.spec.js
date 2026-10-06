import { test, expect, grundaufbau, warteAufDrucke } from './hilfen.js';

/*
  Etikettendatum über den Schichtwechsel.

  Bis Oktober 2026 wurde das Datum einmal beim Laden berechnet. Ein Tablet,
  das über Nacht anblieb, druckte am Morgen das Datum des Vortags – auf
  Lebensmitteletiketten. Diese Tests stellen genau das nach: Seite abends
  öffnen, Uhr über Nacht vorstellen, morgens drucken.

  Die Uhr wird nur für Date festgesetzt; Timer laufen echt. Das Aufwachen des
  Tablets wird mit einem focus-Ereignis nachgestellt.
*/
const oeffnen = async (page, zeit) => {
  await page.clock.setFixedTime(new Date(zeit));
  await grundaufbau(page);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
};

const drucke = async (page, n) => {
  await page.getByRole('button', { name: /^Steak Streifen/ }).first().click();
  const d = await warteAufDrucke(page, n);
  return d[n - 1].felder.Datum;
};

const aufwachen = (page) => page.evaluate(() => window.dispatchEvent(new Event('focus')));

test('über Nacht offen gelassen: morgens wird das neue Datum gedruckt', async ({ page }) => {
  await oeffnen(page, '2026-10-06T22:00:00');
  expect(await drucke(page, 1)).toBe('6.10.2026');

  // Schichtwechsel um 5 Uhr – ohne Neuladen der Seite
  await page.clock.setFixedTime(new Date('2026-10-07T05:30:00'));
  expect(await drucke(page, 2), 'der eigentliche Fehler').toBe('7.10.2026');

  // Die Anzeige zieht spätestens beim Aufwachen nach
  await aufwachen(page);
  await expect(page.locator('.date-current')).toContainText('7.10.2026');
});

test('vor 5 Uhr gehört die Nacht noch zur Schicht des Vortags', async ({ page }) => {
  await oeffnen(page, '2026-10-07T02:30:00');
  expect(await drucke(page, 1)).toBe('6.10.2026');
});

test('ein von Hand gewähltes Datum fällt auf und verfällt zum Schichtwechsel', async ({ page }) => {
  await oeffnen(page, '2026-10-06T14:00:00');
  await expect(page.locator('.date-current')).not.toHaveClass(/abweichend/);

  await page.locator('.react-datepicker__day--004:not(.react-datepicker__day--outside-month)').click();
  await expect(page.locator('.date-current')).toHaveClass(/abweichend/);
  await expect(page.locator('.date-current')).toContainText('nicht heute');
  expect(await drucke(page, 1)).toBe('4.10.2026');

  // Am nächsten Morgen gilt die Wahl nicht mehr – auch ohne Neuladen
  await page.clock.setFixedTime(new Date('2026-10-07T06:00:00'));
  expect(await drucke(page, 2), 'Rückdatierung darf nicht in den nächsten Tag rutschen').toBe('7.10.2026');
  await aufwachen(page);
  await expect(page.locator('.date-current')).not.toHaveClass(/abweichend/);
});

test('„auf heute" stellt die Automatik wieder her', async ({ page }) => {
  await oeffnen(page, '2026-10-06T14:00:00');
  await page.locator('.react-datepicker__day--004:not(.react-datepicker__day--outside-month)').click();
  await page.getByRole('button', { name: 'auf heute' }).click();
  await expect(page.locator('.date-current')).not.toHaveClass(/abweichend/);
  expect(await drucke(page, 1)).toBe('6.10.2026');
});

test('Vorschau zeigt nach einem Datumswechsel das neue Datum – mit Haltbarkeit', async ({ page }) => {
  // Ein Etikett mit 3 Tagen Haltbarkeit vorbelegen
  await page.addInitScript(() => {
    localStorage.setItem('etikett_gruppen_v1', JSON.stringify([
      { id: 'g', name: 'Test', icon: '🥩', entries: [{ name: 'Rinderfond', tage: 3 }] },
    ]));
  });
  await oeffnen(page, '2026-10-06T14:00:00');
  await page.getByRole('button', { name: /^Rinderfond/ }).click();
  await warteAufDrucke(page, 1);
  await expect.poll(() => page.evaluate(() => window.__vorschau?.Datum ?? '')).toBe('06.10. → 09.10.');

  await page.locator('.react-datepicker__day--004:not(.react-datepicker__day--outside-month)').click();
  // Früher: altes Datum, und die Haltbarkeit fiel ganz weg
  await expect.poll(() => page.evaluate(() => window.__vorschau?.Datum ?? '')).toBe('04.10. → 07.10.');
});

test('Kalender spricht Deutsch: Monatsname und Wochentage', async ({ seite }) => {
  await expect(seite.locator('.react-datepicker__current-month')).toHaveText(/Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/);
  await expect(seite.locator('.react-datepicker__day-names')).toContainText('Mo');
  await expect(seite.locator('.react-datepicker__day-names')).not.toContainText('Su');
});
