import { readFileSync } from 'node:fs';
import { test, expect, grundaufbau } from './hilfen.js';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

/*
  Fehlerberichte an Bugsink. Im Test gibt es keinen nginx: die Freigabe unter
  /api/client-config und der Tunnel /api/<projekt>/envelope/ werden hier
  nachgestellt. Geprüft wird die Browserseite: wann gemeldet wird, wohin,
  und dass dabei nie ein echter Schlüssel im Browser auftaucht.
*/
const mitFreigabe = async (page, konfig) => {
  const umschlaege = [];
  await page.route('**/api/client-config', (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(konfig),
  }));
  await page.route('**/api/*/envelope/**', (r) => {
    umschlaege.push({ url: r.request().url(), body: r.request().postData() || '' });
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return umschlaege;
};

const bereit = async (page) => {
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');
};

test('ohne Freigabe wird das SDK nicht einmal geladen', async ({ page }) => {
  await grundaufbau(page);
  const sdk = [];
  page.on('request', (r) => { if (/envelope|sentry/i.test(r.url())) sdk.push(r.url()); });
  await page.route('**/api/client-config', (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: '{"enabled":false}',
  }));
  await bereit(page);
  await page.evaluate(() => setTimeout(() => { throw new Error('E2E: darf nicht gemeldet werden'); }));
  await page.waitForTimeout(1500);
  expect(sdk).toEqual([]);
});

test('ein unbehandelter Fehler geht an den eigenen Ursprung, nicht nach draussen', async ({ page, baseURL }) => {
  await grundaufbau(page);
  const umschlaege = await mitFreigabe(page, { enabled: true, projekt: '9', environment: 'test' });
  const fremd = [];
  page.on('request', (r) => { if (!r.url().startsWith(baseURL)) fremd.push(r.url()); });
  await bereit(page);
  /*
    Erst werfen, wenn das SDK wirklich läuft: es wird nachgeladen, sobald die
    Freigabe vom Server da ist. Auf dem langsameren Tablet-Durchlauf war es
    manchmal noch nicht so weit, und der Fehler ging ungezählt verloren – ein
    Wackler im Test, kein Fehler der App. Sentry legt beim Start window.__SENTRY__ an.
  */
  await page.waitForFunction(() => Boolean(window.__SENTRY__), null, { timeout: 10_000 });

  await page.evaluate(() => setTimeout(() => { throw new Error('E2E-Probe: unbehandelt'); }));
  await expect.poll(() => umschlaege.length, { timeout: 10_000 }).toBeGreaterThan(0);

  const u = umschlaege[0];
  expect(new URL(u.url).pathname).toBe('/api/9/envelope/');
  expect(u.body).toContain('E2E-Probe: unbehandelt');
  expect(u.body).toContain(`labelkitchen@${VERSION}`);
  expect(u.body).toContain('"environment":"test"');
  // Nur der Platzhalter – der echte Schlüssel bleibt im Container
  expect(new URL(u.url).searchParams.get('sentry_key')).toBe('labelkitchen');
  expect(u.body, 'kein DSN im Umschlag, sonst lehnt Bugsink ab').not.toContain('"dsn"');
  expect(fremd.filter((x) => !x.startsWith('data:')), 'nichts verlässt den Küchenserver').toEqual([]);
});

test('ein gescheiterter Druck wird mit Grund und Zahlen gemeldet', async ({ page }) => {
  // Drucker ohne Kopien-Funktion, der schon beim ersten Auftrag streikt
  await grundaufbau(page, ['DYMO Küche'], false, 1);
  const umschlaege = await mitFreigabe(page, { enabled: true, projekt: '9' });
  await bereit(page);

  await page.getByRole('button', { name: 'Eines mehr' }).click();
  await page.getByRole('button', { name: /^Steak/ }).first().click();
  await expect(page.locator('.print-error')).toBeVisible();

  await expect.poll(() => umschlaege.length, { timeout: 10_000 }).toBeGreaterThan(0);
  const body = umschlaege.map((u) => u.body).join('\n');
  expect(body).toContain('Druckauftrag gescheitert');
  expect(body).toContain('Print job failed');
  expect(body).toContain('"offen":2');
});

test('ein streikender Drucker meldet nicht bei jedem Klick', async ({ page }) => {
  await grundaufbau(page, ['DYMO Küche'], false, 1);
  const umschlaege = await mitFreigabe(page, { enabled: true, projekt: '9' });
  await bereit(page);

  for (let i = 0; i < 4; i += 1) {
    await page.getByRole('button', { name: /^Steak/ }).first().click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(2000);
  const druck = umschlaege.filter((u) => u.body.includes('Druckauftrag gescheitert'));
  // Jede Meldung startet eine Triage-Routine – vier Klicks, eine Meldung
  expect(druck.length).toBe(1);
});
