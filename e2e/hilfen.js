import { expect as basisExpect, test as basis } from '@playwright/test';

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/*
  Ohne angeschlossenen DYMO ist jeder Knopf ausgegraut und die Tests prüfen
  nichts. Deshalb wird das Framework gefälscht – und protokolliert nebenbei
  jeden Druckauftrag, damit Stückzahl und Ziel prüfbar werden.
*/
export const dymoFaelschen = (drucker = ['DYMO Küche'], kannKopien = true) => ([liste, kopien, png, scheitertAb]) => {
  window.__drucke = [];
  const framework = {
    init: () => {},
    getPrinters: () => liste.map((name) => ({ name })),
    openLabelXml: () => {
      const felder = {};
      return {
        setObjectText: (k, v) => { felder[k] = v; },
        print: (ziel, params) => {
          // Ab dem eingestellten Auftrag streiken – so lässt sich ein Abbruch
          // mitten in der Serie prüfen, ohne einen echten Drucker zu quälen.
          if (scheitertAb && window.__drucke.length + 1 >= scheitertAb) {
            throw new Error('Print job failed');
          }
          window.__drucke.push({ ziel, params: params ?? null, felder: { ...felder } });
        },
        render: () => png,
      };
    },
  };
  if (kopien) {
    framework.createLabelWriterPrintParamsXml = ({ copies }) =>
      `<LabelWriterPrintParams><Copies>${copies}</Copies></LabelWriterPrintParams>`;
  }
  Object.defineProperty(window, 'dymo', {
    configurable: true, writable: true, value: { label: { framework } },
  });
};

/* Ausgangsstand für die Katze, damit Freischaltungen und Zustand fest stehen. */
export const spielstand = (werte) => (v) => {
  try { for (const [k, val] of Object.entries(v)) localStorage.setItem(k, String(val)); } catch { /* gesperrt */ }
};

export const STAND_SATT = {
  cat_coinCount: 900, cat_coinPeak: 1410,
  cat_hunger: 85, cat_thirst: 85, cat_lastSeen: Date.now(),
};

/*
  Grundgerüst: fälscht DYMO, setzt den Spielstand und meldet Seitenfehler als
  Testfehler – sonst schluckt die ErrorBoundary sie stillschweigend.
*/
/*
  Das echte DYMO-Script wird nicht geladen: es meldet sonst
  "Namespace already declared" gegen unsere Fälschung – ein Geräusch aus dem
  Testaufbau, das echte Seitenfehler überdecken würde.
*/
export const echtesDymoBlocken = (page) =>
  page.route('**/dymo.connect.framework.js', (route) => route.fulfill({
    status: 200, contentType: 'application/javascript', body: '/* im Test ersetzt */',
  }));

/* Grundaufbau für Tests, die die rohe page brauchen (eigene Routen o. ä.). */
export const grundaufbau = async (page, drucker = ['DYMO Küche'], kannKopien = true, scheitertAb = 0) => {
  await echtesDymoBlocken(page);
  await page.addInitScript(dymoFaelschen(), [drucker, kannKopien, PNG, scheitertAb]);
  await page.addInitScript(spielstand(), STAND_SATT);
};

export const test = basis.extend({
  seite: async ({ page }, benutze) => {
    await echtesDymoBlocken(page);
    await page.addInitScript(dymoFaelschen(), [['DYMO Küche'], true, PNG]);
    await page.addInitScript(spielstand(), STAND_SATT);
    const fehler = [];
    page.on('pageerror', (e) => fehler.push(String(e)));
    await page.goto('/');
    // Auf die Druckererkennung warten statt auf die Uhr – spart je Test rund
    // eine Sekunde und ist zuverlässiger als ein fester Wert.
    await page.waitForSelector('.status-indicator .online', { timeout: 15_000 });
    await benutze(page);
    if (fehler.length) throw new Error('Seitenfehler: ' + [...new Set(fehler)].join(' | '));
  },
});

export { expect } from '@playwright/test';

/* Das Gimmick-Menü der Katze öffnen und einen Eintrag treffen. */
export const menuepunkt = async (page, muster) => {
  if (await page.locator('.gimmick-panel button', { hasText: muster }).count()) {
    return page.locator('.gimmick-panel button', { hasText: muster }).first();
  }
  const anzahl = await page.locator('.gimmick-toggle-inline').count();
  for (let i = 0; i < anzahl; i += 1) {
    await page.locator('.gimmick-toggle-inline').nth(i).click();
    await page.waitForTimeout(250);
    const treffer = page.locator('.gimmick-panel button', { hasText: muster });
    if (await treffer.count()) return treffer.first();
    await page.locator('.gimmick-toggle-inline').nth(i).click();
    await page.waitForTimeout(150);
  }
  throw new Error(`Menüpunkt nicht gefunden: ${muster}`);
};

/*
  Gedruckt wird erst, wenn die Etikettenvorlage geladen ist – der Aufruf landet
  also im .then() eines fetch. Direkt nach dem Klick zu lesen ist ein Wettlauf.
*/
export const warteAufDrucke = async (page, anzahl) => {
  await basisExpect.poll(
    () => page.evaluate(() => window.__drucke.length),
    { message: `erwartet: ${anzahl} Druckauftrag/Druckaufträge`, timeout: 10_000 },
  ).toBe(anzahl);
  return page.evaluate(() => window.__drucke);
};
