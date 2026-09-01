import { test, expect, dymoFaelschen, echtesDymoBlocken, spielstand, warteAufDrucke, STAND_SATT } from './hilfen.js';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.describe('Drucken', () => {
  test('Klick auf ein Etikett druckt Name und Datum', async ({ seite }) => {
    await seite.getByRole('button', { name: /^Steak/ }).first().click();
    const drucke = await warteAufDrucke(seite, 1);
    expect(drucke[0].felder.Name).toBe('Steak');
    expect(drucke[0].felder.Datum).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
  });

  test('Stückzahl wird als Kopien übergeben und ist auf den Knöpfen sichtbar', async ({ seite }) => {
    await expect(seite.locator('.anzahl-wert')).toHaveText('1');
    expect(await seite.locator('.anzahl-marke').count()).toBe(0);

    await seite.getByRole('button', { name: 'Eines mehr' }).click();
    await seite.getByRole('button', { name: 'Eines mehr' }).click();
    await expect(seite.locator('.anzahl-wert')).toHaveText('3');
    // Jeder Etiketten-Knopf zeigt die Menge, damit niemand versehentlich mehr druckt
    expect(await seite.locator('.anzahl-marke').count()).toBeGreaterThan(20);

    await seite.getByRole('button', { name: /^Filet($|\s)/ }).first().click();
    const drucke = await warteAufDrucke(seite, 1);
    expect(drucke[0].params).toContain('<Copies>3</Copies>');
  });

  test('Stückzahl bleibt zwischen 1 und 20', async ({ seite }) => {
    const weniger = seite.getByRole('button', { name: 'Eines weniger' });
    const mehr = seite.getByRole('button', { name: 'Eines mehr' });
    await expect(weniger).toBeDisabled();
    for (let i = 0; i < 30 && (await mehr.isEnabled()); i += 1) await mehr.click();
    await expect(seite.locator('.anzahl-wert')).toHaveText('20');
    await expect(mehr).toBeDisabled();
    await seite.getByRole('button', { name: 'zurück auf 1' }).click();
    await expect(seite.locator('.anzahl-wert')).toHaveText('1');
  });

  test('ohne Kopien-Funktion wird mehrfach einzeln gedruckt', async ({ page }) => {
    await echtesDymoBlocken(page);
    await page.addInitScript(dymoFaelschen(), [['DYMO Küche'], false, PNG]);
    await page.addInitScript(spielstand(), STAND_SATT);
    await page.goto('/');
    await page.waitForSelector('.status-indicator .online', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Eines mehr' }).click();
    await page.getByRole('button', { name: 'Eines mehr' }).click();
    await page.getByRole('button', { name: /^Steak/ }).first().click();
    const drucke = await warteAufDrucke(page, 3);
    expect(drucke.every((d) => d.params === null)).toBe(true);
  });
});

test.describe('Druckerauswahl', () => {
  test('bei einem Drucker gibt es nichts zu wählen', async ({ seite }) => {
    expect(await seite.locator('.drucker-wahl').count()).toBe(0);
  });

  test('bei zwei Druckern wird gewählt, gemerkt und dorthin gedruckt', async ({ page }) => {
    await echtesDymoBlocken(page);
    await page.addInitScript(dymoFaelschen(), [['DYMO Küche', 'DYMO Bar'], true, PNG]);
    await page.addInitScript(spielstand(), STAND_SATT);
    await page.goto('/');
    await page.waitForSelector('.status-indicator .online', { timeout: 15_000 });

    const auswahl = page.locator('.drucker-wahl select');
    await expect(auswahl).toHaveValue('DYMO Küche');
    await auswahl.selectOption('DYMO Bar');
    await page.getByRole('button', { name: /^Steak/ }).first().click();

    const drucke = await warteAufDrucke(page, 1);
    expect(drucke[0].ziel).toBe('DYMO Bar');

    await page.reload();
    await page.waitForSelector('.status-indicator .online', { timeout: 15_000 });
    await expect(page.locator('.drucker-wahl select')).toHaveValue('DYMO Bar');
  });

  test('abgezogener Drucker fällt auf den vorhandenen zurück', async ({ page }) => {
    await echtesDymoBlocken(page);
    await page.addInitScript(dymoFaelschen(), [['DYMO Küche'], true, PNG]);
    await page.addInitScript(spielstand(), { ...STAND_SATT, etikett_drucker: 'DYMO Weg' });
    await page.goto('/');
    await expect(page.locator('.status-indicator')).toContainText('DYMO Küche', { timeout: 15_000 });
  });
});

test('scheitert der Kopien-Parameter, wird trotzdem gedruckt', async ({ page }) => {
  await echtesDymoBlocken(page);
  // Ein Dienst, der printParams ablehnt – genau der gemeldete Fall
  await page.addInitScript((png) => {
    window.__drucke = [];
    const framework = {
      init: () => {},
      getPrinters: () => [{ name: 'DYMO Küche' }],
      createLabelWriterPrintParamsXml: ({ copies }) =>
        `<LabelWriterPrintParams><Copies>${copies}</Copies></LabelWriterPrintParams>`,
      openLabelXml: () => ({
        setObjectText: () => {},
        print: (ziel, params) => {
          if (params) throw new Error('printParams abgelehnt');
          window.__drucke.push({ ziel, params: null });
        },
        render: () => png,
      }),
    };
    Object.defineProperty(window, 'dymo', {
      configurable: true, writable: true, value: { label: { framework } },
    });
  }, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
  await page.addInitScript(spielstand(), STAND_SATT);
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');

  await page.getByRole('button', { name: 'Eines mehr' }).click();
  await page.getByRole('button', { name: 'Eines mehr' }).click();
  await page.getByRole('button', { name: /^Steak/ }).first().click();

  const drucke = await warteAufDrucke(page, 3);
  expect(drucke.every((d) => d.params === null)).toBe(true);
  // Und keine Fehlermeldung an den Anwender – die Etiketten kamen ja heraus
  expect(await page.locator('.print-error').count()).toBe(0);
});
