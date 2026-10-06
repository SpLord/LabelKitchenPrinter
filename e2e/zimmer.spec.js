import { test, expect, grundaufbau, warteAufDrucke } from './hilfen.js';

/*
  Katzenzimmer – seit 1.5.0 Standard auf der Hauptseite. Das alte Spiel ist
  bis zum Aufräumen nur noch unter ?alt erreichbar.

  Das Wichtigste zuerst: die Küche druckt mit dem Zimmer genauso wie vorher. Das Zimmer ist Spielerei; der Etikettendruck
  ist die Arbeit.
*/
const oeffnen = async (page, pfad, werte = {}) => {
  await grundaufbau(page);
  await page.addInitScript((w) => {
    try { for (const [k, v] of Object.entries(w)) localStorage.setItem(k, String(v)); } catch { /* gesperrt */ }
  }, { cat_coinCount: 500, cat_coinPeak: 1410, cat_lastSeen: Date.now(), cat_fwDone: '1', cat_hunger: 80, cat_thirst: 80, ...werte });
  await page.goto(pfad);
  await page.waitForSelector('.status-indicator .online');
};

test('Notausgang ?alt: alte Katze, keine Karte', async ({ page }) => {
  await oeffnen(page, '/?alt');
  await expect(page.locator('.cat-sprite')).toHaveCount(1);
  await expect(page.locator('.kuechen-karte')).toHaveCount(0);
});

test('Hauptseite: Karte statt alter Katze', async ({ page }) => {
  await oeffnen(page, '/');
  await expect(page.locator('.kuechen-karte')).toBeVisible();
  await expect(page.locator('.cat-sprite')).toHaveCount(0);
  await expect(page.locator('.kuechen-karte')).toContainText('Mails');
  await expect(page.locator('.kuechen-karte')).toContainText('500');
});

/* Die Küchenkatze lebt im freien Streifen der Kopfleiste (1.8.0). Ob sie
   gerade läuft, steuert der Test nicht – er prüft nur, was immer gelten muss. */
const ueberlappt = (page) => page.evaluate(() => {
  const k = document.querySelector('.kuechen-katze');
  if (!k) return null;
  const a = k.getBoundingClientRect();
  return [...document.querySelectorAll('button, select, input, .status-indicator, .kuechen-karte')]
    .filter((e) => e !== k && !k.contains(e))
    .filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    })
    .map((e) => e.className || e.tagName);
});

test('Küchenkatze: Mails sitzt in der Kopfleiste und verdeckt nichts', async ({ page }, info) => {
  await oeffnen(page, '/');
  await expect(page.locator('.app-bar .kuechen-katze')).toBeVisible();
  for (let i = 0; i < 4; i += 1) {
    expect(await ueberlappt(page), `${info.project.name}, Messung ${i}`).toEqual([]);
    await page.waitForTimeout(700);
  }
});

test('Küchenkatze: ein Tipp auf sie öffnet das Zimmer', async ({ page }) => {
  await oeffnen(page, '/');
  // dispatchEvent statt click: sie darf dabei gerade laufen
  await page.locator('.kuechen-katze').dispatchEvent('click');
  await expect(page.locator('.zimmer')).toBeVisible();
  await expect(page.locator('.kuechen-katze')).toHaveCount(0);
});

test('Küchenkatze: Durst steht als Denkblase über ihr', async ({ page }) => {
  await oeffnen(page, '/', { cat_thirst: 20 });
  await expect(page.locator('.kuechen-katze .kuechen-katze-blase')).toBeVisible();
  await expect(page.locator('.kuechen-katze')).toHaveAttribute('aria-label', /hat Durst/);
});

test('die Küche druckt wie immer', async ({ page }) => {
  await oeffnen(page, '/');
  await page.getByRole('button', { name: /^Steak/ }).first().click();
  expect((await warteAufDrucke(page, 1))[0].felder.Name).toBe('Steak');
});

test('die Karte zeigt, was ihr fehlt', async ({ page }) => {
  await oeffnen(page, '/', { cat_thirst: 20 });
  await expect(page.locator('.kuechen-karte')).toContainText('hat Durst');
  await expect(page.locator('.kuechen-karte-punkt')).toBeVisible();
});

test('Zimmer öffnen, Napf füllen, zurück in die Küche', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_napf: 10 });
  await page.locator('.kuechen-karte').click();
  await expect(page.locator('.zimmer-szene')).toBeVisible();
  await expect(page.locator('.zimmer-name')).toContainText('Mails');

  await page.locator('.zimmer-menue').getByRole('button', { name: /Füttern/ }).click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 10 % voll');
  // Trockenfutter: 3 Münzen, +20 in den Napf
  await page.locator('.zimmer-karte', { hasText: 'Trockenfutter' }).locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 30 % voll');
  await expect(page.locator('.zimmer-geld')).toContainText('497');

  await page.locator('.zimmer-blatt-zu').click();
  await page.getByRole('button', { name: '← Küche' }).click();
  await expect(page.locator('.zimmer')).toHaveCount(0);
  await expect(page.locator('.kuechen-karte')).toContainText('497');
});

test('voller Napf lässt sich nicht weiter füllen', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_napf: 100 });
  await page.locator('.kuechen-karte').click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Füttern/ }).click();
  await expect(page.locator('.zimmer-karte', { hasText: 'Trockenfutter' }).locator('.zimmer-preis')).toBeDisabled();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf ist voll');
});

test('gekaufte Ausstattung steht im Zimmer', async ({ page }) => {
  await oeffnen(page, '/', { cat_besitz: JSON.stringify(['kratzbaum', 'trinkbrunnen']) });
  await page.locator('.kuechen-karte').click();
  await expect(page.locator('[data-moebel="kratzbaum"]')).toHaveCount(1);
  await expect(page.locator('[data-moebel="trinkbrunnen"]')).toHaveCount(1);
  await expect(page.locator('[data-moebel="wassernapf"]')).toHaveCount(0);
  await expect(page.locator('[data-moebel="kuschelhoehle"]')).toHaveCount(0);
});

test('die Karte ist unübersehbar ein Knopf zum Zimmer', async ({ page }) => {
  await oeffnen(page, '/');
  await expect(page.locator('.kuechen-karte')).toContainText('Zimmer ›');
  // Sie liegt oben und nimmt den Tipp – vorher lag die Kopfleiste darüber
  const mitte = await page.locator('.kuechen-karte').boundingBox();
  const oben = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.kuechen-karte'),
    [mitte.x + mitte.width / 2, mitte.y + mitte.height / 2]);
  expect(oben).toBe(true);
});

test('ohne Münzen gibt es einmal am Tag eine Notration', async ({ page }) => {
  await oeffnen(page, '/', { cat_coinCount: 0, cat_coinPeak: 0, zimmer_napf: 0 });
  await page.locator('.kuechen-karte').click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Füttern/ }).click();
  const karte = page.locator('.zimmer-karte', { hasText: 'Notration' });
  await karte.locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 20 % voll');
  await expect(karte.locator('.zimmer-preis')).toBeDisabled();
  await expect(karte).toContainText('Morgen wieder');
});

test('kranke Katze: Medizin hilft, notfalls kostenlos', async ({ page }) => {
  await oeffnen(page, '/', { cat_coinCount: 10, cat_krank: '1', cat_hunger: 30, cat_thirst: 30 });
  await page.locator('.kuechen-karte').click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Füttern/ }).click();
  const karte = page.locator('.zimmer-karte', { hasText: 'Medizin' });
  await expect(karte).toContainText('kostenlos');
  await karte.locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-karte', { hasText: 'Medizin' })).toHaveCount(0);
});

// ── Spielen ──────────────────────────────────────────────────────────────────

const spielenOeffnen = async (page, werte = {}) => {
  await oeffnen(page, '/', werte);
  await page.locator('.kuechen-karte').click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
};

test('Spielen bietet Federangel und Leckerli fangen', async ({ page }) => {
  await spielenOeffnen(page);
  await expect(page.locator('.zimmer-karte', { hasText: 'Federangel' }).locator('.zimmer-preis')).toBeEnabled();
  await expect(page.locator('.zimmer-karte', { hasText: 'Leckerli fangen' }).locator('.zimmer-preis')).toBeEnabled();
});

test('Federangel: läuft, die Menüleiste ist weg, Fertig beendet', async ({ page }) => {
  await spielenOeffnen(page);
  await page.locator('.zimmer-karte', { hasText: 'Federangel' }).locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-spiel')).toBeVisible();
  // Während des Spiels kein Menü – ein Fehltipp darf das Spiel nicht abbrechen
  await expect(page.locator('.zimmer-menue')).toHaveCount(0);
  await page.mouse.move(500, 560, { steps: 5 });
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-spiel')).toHaveCount(0);
  await expect(page.locator('.zimmer-ergebnis')).toBeVisible();
  await expect(page.locator('.zimmer-menue')).toBeVisible();
});

test('Leckerli fangen: danach eine Stunde Pause', async ({ page }) => {
  await spielenOeffnen(page);
  await page.locator('.zimmer-karte', { hasText: 'Leckerli fangen' }).locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-spiel')).toBeVisible();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
  const karte = page.locator('.zimmer-karte', { hasText: 'Leckerli fangen' });
  await expect(karte.locator('.zimmer-preis')).toBeDisabled();
  await expect(karte).toContainText('wieder in 60 min');
});

test('Leckerli fangen: gefangene Leckerlis werden zu Münzen', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-06T12:00:00') });
  await spielenOeffnen(page, { cat_coinCount: 100 });
  await page.locator('.zimmer-karte', { hasText: 'Leckerli fangen' }).locator('.zimmer-preis').click();
  // Napf jedem Leckerli hinterherführen: es landet dort, wo es fällt
  const flaeche = await page.locator('.zimmer-spiel').boundingBox();
  for (let t = 0; t < 30; t += 1) {
    const x = await page.evaluate(() => {
      const g = [...document.querySelectorAll('.zimmer-leckerli.faellt')].map((e) => e.parentElement.getAttribute('transform'));
      const m = g.length ? /translate\(([\d.]+)/.exec(g[0]) : null;
      return m ? Number(m[1]) : null;
    });
    if (x !== null) await page.mouse.move(flaeche.x + (x / 1024) * flaeche.width, flaeche.y + flaeche.height * 0.8);
    await page.clock.runFor(1000);
  }
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Münzen');
  const stand = Number((await page.locator('.zimmer-geld').innerText()).replace(/\D/g, ''));
  expect(stand).toBeGreaterThan(100);
  expect(stand).toBeLessThanOrEqual(110);
});
