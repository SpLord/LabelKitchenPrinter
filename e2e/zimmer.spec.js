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
  await expect(page.locator('.kuechen-karte')).toContainText('Mieze');
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

test('Küchenkatze: sie sitzt in der Kopfleiste und verdeckt nichts', async ({ page }, info) => {
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
  await expect(page.getByRole('textbox', { name: /Name der Katze/ })).toHaveValue('Mieze');

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
  // Bis die Ergebnismeldung kommt – sie steht nur 2,6 s, danach wäre sie weg
  for (let t = 0; t < 40 && (await page.locator('.zimmer-ergebnis').count()) === 0; t += 1) {
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

/* ── Etappe 3a: Einrichten, Katzenklo, Häufchen ───────────────────────── */
const STUNDE = 3_600_000;
const kloStand = (z) => JSON.stringify({ letzterGang: Date.now(), klo: 0, haeufchen: [], putzen: { tag: '', summe: 0 }, ...z });
const heute = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const zimmerAuf = async (page, werte) => {
  await oeffnen(page, '/', werte);
  await page.locator('.kuechen-karte').click();
  await expect(page.locator('.zimmer-szene')).toBeVisible();
};

test('Einrichten: Katzenklo kaufen – es steht danach im Zimmer', async ({ page }) => {
  await zimmerAuf(page, { zimmer_klo: kloStand({}) });
  await expect(page.locator('[data-moebel="katzenklo"]')).toHaveCount(0);
  await page.locator('.zimmer-menue').getByRole('button', { name: /Einrichten/ }).click();
  const karte = page.locator('.zimmer-karte[data-artikel="katzenklo"]');
  await expect(karte).toContainText('150');
  await karte.locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-blatt')).toHaveCount(0);
  await expect(page.locator('[data-moebel="katzenklo"]')).toHaveCount(1);
  await expect(page.locator('.zimmer-geld')).toContainText('350');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Katzenklo steht jetzt im Zimmer');

  await page.locator('.zimmer-menue').getByRole('button', { name: /Einrichten/ }).click();
  await expect(karte).toContainText('steht im Zimmer');
});

test('Einrichten: ein Tipp auf einen freien Platz öffnet es', async ({ page }) => {
  await zimmerAuf(page, { zimmer_klo: kloStand({}) });
  await page.locator('[data-platz="klo"]').click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Katzenklo');
});

test('ohne Klo: verpasste Gänge liegen als Häufchen da, wegmachen bringt 2 Münzen', async ({ page }) => {
  await zimmerAuf(page, { zimmer_klo: kloStand({ letzterGang: Date.now() - 9 * STUNDE }) });
  const haufen = page.locator('[data-haeufchen]');
  await expect(haufen).toHaveCount(2);
  // dispatchEvent: die Katze darf dabei draufsitzen (dann fängt sie den Tipp ab)
  await haufen.last().dispatchEvent('click');
  await expect(haufen).toHaveCount(1);
  await expect(page.locator('.zimmer-geld')).toContainText('502');
  await expect(page.locator('.zimmer-lohn')).toContainText('+2');
});

test('mit Klo: Gänge landen im Klo, leeren bringt 3 Münzen', async ({ page }) => {
  await zimmerAuf(page, {
    cat_besitz: JSON.stringify(['katzenklo']),
    zimmer_klo: kloStand({ letzterGang: Date.now() - 9 * STUNDE }),
  });
  await expect(page.locator('[data-haeufchen]')).toHaveCount(0);
  const klo = page.getByRole('button', { name: 'Katzenklo leeren' });
  await expect(klo).toBeVisible();
  await klo.click();
  await expect(page.locator('.zimmer-geld')).toContainText('503');
  await expect(page.getByRole('button', { name: 'Katzenklo leeren' })).toHaveCount(0);
});

test('Putzen: nach 30 Münzen am Tag gibt es nur noch ein Danke', async ({ page }) => {
  await zimmerAuf(page, {
    zimmer_klo: kloStand({ letzterGang: Date.now() - 5 * STUNDE, putzen: { tag: heute(), summe: 30 } }),
  });
  await page.locator('[data-haeufchen]').first().dispatchEvent('click');
  await expect(page.locator('[data-haeufchen]')).toHaveCount(0);
  await expect(page.locator('.zimmer-geld')).toContainText('500');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('keine Münzen mehr');
});

test('Küchenkarte: viele Häufchen → braucht Putzen', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_klo: kloStand({ letzterGang: Date.now() - 13 * STUNDE }) });
  await expect(page.locator('.kuechen-karte')).toContainText('braucht Putzen');
});

test('Name: sie heisst Mieze, nicht wie der Koch – und lässt sich umbenennen', async ({ page }) => {
  await zimmerAuf(page, {});
  const feld = page.getByRole('textbox', { name: /Name der Katze/ });
  await expect(feld).toHaveValue('Mieze');
  await feld.fill('Luna');
  await feld.press('Enter');
  await page.getByRole('button', { name: '← Küche' }).click();
  await expect(page.locator('.kuechen-karte')).toContainText('Luna');
  await page.reload();
  await expect(page.locator('.kuechen-karte')).toContainText('Luna');
});

/* ── Etappe 3b: tägliches Geschenk, Pflege, Selbstheilung ─────────────── */
const schichtTag = (versatzTage = 0) => {
  const d = new Date(Date.now() - 5 * STUNDE + versatzTage * 24 * STUNDE);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('Geschenk: liegt einmal am Tag im Zimmer, bringt Münzen und ist dann weg', async ({ page }) => {
  await zimmerAuf(page, { zimmer_klo: kloStand({}) });
  const paket = page.getByRole('button', { name: 'Geschenk öffnen' });
  await expect(paket).toBeVisible();
  await paket.dispatchEvent('click');
  // ohne Pflege am Vortag: 10 Münzen, dazu 4 für das eine Herz der Testkatze
  await expect(page.locator('.zimmer-geld')).toContainText('514');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Geschenk von Mieze: +14 Münzen');
  await expect(paket).toHaveCount(0);
  await page.reload();
  await page.locator('.kuechen-karte').click();
  await expect(page.locator('.zimmer-szene')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Geschenk öffnen' })).toHaveCount(0);
});

test('Geschenk: Pflege vom Vortag macht es grösser', async ({ page }) => {
  await zimmerAuf(page, {
    zimmer_klo: kloStand({}),
    zimmer_pflege: JSON.stringify({ tag: schichtTag(-1), punkte: 20 }),
  });
  await page.getByRole('button', { name: 'Geschenk öffnen' }).dispatchEvent('click');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('+34 Münzen');
});

test('Küchenkarte: wartet ein Geschenk, sagt sie es', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_klo: kloStand({}) });
  await expect(page.locator('.kuechen-karte')).toContainText('Geschenk wartet');
  await expect(page.locator('.kuechen-karte-punkt')).toBeVisible();
});

test('Selbstheilung: zwölf Stunden gut versorgt → wieder gesund, ohne Medizin', async ({ page }) => {
  await zimmerAuf(page, {
    zimmer_klo: kloStand({}), zimmer_geschenk: schichtTag(0),
    cat_krank: '1', cat_hunger: 80, cat_thirst: 80, zimmer_gut_seit: Date.now() - 13 * STUNDE,
  });
  await expect(page.locator('.kuechen-karte')).not.toContainText('ist krank');
});

/* ── Etappe 4: Laden und Kleiderschrank ───────────────────────────────── */
test('Laden: Brille kaufen – sie trägt sie sofort, die Karte sagt „im Schrank“', async ({ page }) => {
  await zimmerAuf(page, { zimmer_klo: kloStand({}), zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-menue').getByRole('button', { name: /Laden/ }).click();
  const karte = page.locator('.zimmer-karte[data-artikel="brille"]');
  await karte.locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-geld')).toContainText('0');
  await expect(page.locator('.zimmer-geld')).not.toContainText('500');
  await expect(karte).toContainText('im Schrank');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Brille gekauft');
  // An der Katze im Zimmer: die Brille ist gezeichnet
  await page.locator('.zimmer-blatt-zu').click();
  await expect(page.locator('.zimmer-szene .kz-brille').first()).toBeAttached();
});

test('Kleiderschrank: an- und ablegen, Standardfell zurück', async ({ page }) => {
  await zimmerAuf(page, {
    zimmer_klo: kloStand({}), zimmer_geschenk: schichtTag(0),
    cat_besitz: JSON.stringify(['halsband', 'fell-ginger']),
    cat_angelegt: JSON.stringify({ fell: 'fell-ginger' }),
  });
  await page.locator('.zimmer-menue').getByRole('button', { name: /Kleiderschrank/ }).click();
  const halsband = page.locator('.zimmer-wahl[data-artikel="halsband"]');
  await expect(halsband).toHaveAttribute('aria-pressed', 'false');
  await halsband.click();
  await expect(halsband).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.zimmer-schrank-spiegel .kz-halsband')).toBeAttached();

  await expect(page.locator('.zimmer-wahl[data-artikel="fell-ginger"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.zimmer-wahl', { hasText: 'Standard' }).click();
  await expect(page.locator('.zimmer-wahl', { hasText: 'Standard' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.zimmer-wahl[data-artikel="fell-ginger"]')).toHaveAttribute('aria-pressed', 'false');
});

/* ── Etappe 5: Mäuseloch und Hütchenspiel im Zimmer ───────────────────── */
test('Mäuseloch: Maus antippen, Mieze springt hin, am Ende gibt es Laune', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Mäuseloch' }).locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-menue')).toHaveCount(0);
  const maus = page.locator('[data-maus]');
  await expect(maus).toHaveCount(1, { timeout: 5000 });
  await maus.dispatchEvent('pointerdown');
  await expect(page.locator('.zimmer-spiel-hud')).toContainText('1 Maus');
  await expect(page.locator('.zimmer-katze')).toHaveClass(/tut-jagen/);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-ergebnis')).toContainText('1 Maus');
  await expect(page.locator('.zimmer-menue')).toBeVisible();
});

test('Hütchenspiel im Zimmer: Einsatz geht ab, Schließen führt zurück ins Zimmer', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Hütchenspiel' }).locator('.zimmer-preis').click();
  await expect(page.getByRole('dialog', { name: 'Hütchenspiel' })).toBeVisible();
  await expect(page.locator('.zimmer-geld')).toContainText('495');
  await page.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog', { name: 'Hütchenspiel' })).toHaveCount(0);
  await expect(page.locator('.zimmer-menue')).toBeVisible();
});
