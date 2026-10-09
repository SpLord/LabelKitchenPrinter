import { test, expect, grundaufbau, warteAufDrucke } from './hilfen.js';

/*
  Katzenzimmer – seit 1.5.0 Standard auf der Hauptseite, seit Etappe 8 das
  einzige Katzenspiel.

  Das Wichtigste zuerst: die Küche druckt mit dem Zimmer genauso wie vorher. Das Zimmer ist Spielerei; der Etikettendruck
  ist die Arbeit.
*/
const oeffnen = async (page, pfad, werte = {}) => {
  await grundaufbau(page);
  await page.addInitScript((w) => {
    try { for (const [k, v] of Object.entries(w)) localStorage.setItem(k, String(v)); } catch { /* gesperrt */ }
  // zimmer_herzen_gesehen: 5 – sonst läge die Herz-Feier über jedem Test
  }, { cat_coinCount: 500, cat_lastSeen: Date.now(), cat_fwDone: '1', cat_hunger: 80, cat_thirst: 80,
    zimmer_herzen_gesehen: 5, ...werte });
  await page.goto(pfad);
  await page.waitForSelector('.status-indicator .online');
};

test('Hauptseite: die Karte zeigt Name und Münzen', async ({ page }) => {
  await oeffnen(page, '/');
  await expect(page.locator('.kuechen-karte')).toBeVisible();
  await expect(page.locator('.kuechen-karte')).toContainText('Mieze');
  await expect(page.locator('.kuechen-karte')).toContainText('500');
});

/* Die Küchenkatze läuft in der Kopfleiste und auf freien Böden (2.2.0). Ob sie
   gerade läuft oder springt, steuert der Test nicht – er prüft nur, was immer
   gelten muss. Im Sprung ist sie nicht antippbar und zählt deshalb nicht. */
const ueberlappt = (page) => page.evaluate(() => {
  const ebene = document.querySelector('.kuechen-katze-ebene');
  const k = document.querySelector('.kuechen-katze');
  if (!k || ebene.classList.contains('springt')) return [];
  const a = k.getBoundingClientRect();
  return [...document.querySelectorAll('button, select, input, .status-indicator, .kuechen-karte, .button-group, .side-rail > *')]
    .filter((e) => e !== k && !k.contains(e) && !ebene.contains(e))
    .filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    })
    .map((e) => e.className || e.tagName);
});

test('Küchenkatze: sie verdeckt nie ein Etikett oder einen Knopf – auch nach Sprüngen', async ({ page }, info) => {
  await oeffnen(page, '/');
  await expect(page.locator('.kuechen-katze')).toBeVisible();
  for (let i = 0; i < 16; i += 1) {
    expect(await ueberlappt(page), `${info.project.name}, Messung ${i}`).toEqual([]);
    await page.waitForTimeout(500);
  }
});

test('Küchenkatze: Antippen streichelt und bietet Füttern und Zimmer an', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_napf: 10 });
  // dispatchEvent statt click: sie darf dabei gerade laufen
  await page.locator('.kuechen-katze').dispatchEvent('click');
  const menue = page.getByRole('group', { name: /was tun/ });
  await expect(menue).toBeVisible();
  await expect(page.locator('.kuechen-katze-herz')).toBeAttached();
  await menue.getByRole('button', { name: /Füttern/ }).dispatchEvent('click');
  await expect(page.locator('.kuechen-karte')).toContainText('497');
  await expect(page.locator('.kuechen-katze-spruch')).toContainText('Danke');

  await page.locator('.kuechen-katze').dispatchEvent('click');
  await page.getByRole('group', { name: /was tun/ }).getByRole('button', { name: 'Zimmer ›' }).dispatchEvent('click');
  await expect(page.locator('.zimmer')).toBeVisible();
  await expect(page.locator('.kuechen-katze')).toHaveCount(0);
});

test('Küchenkatze: freut sich über ein gedrucktes Etikett', async ({ page }) => {
  await oeffnen(page, '/');
  await page.getByRole('button', { name: /^Steak/ }).first().click();
  await warteAufDrucke(page, 1);
  await expect(page.locator('.kuechen-katze-spruch')).toContainText('Steak');
});

test('Küchenkatze: auf dem Tablet gibt es die freie Lücke unter „Fleisch“, und dort liegt nichts', async ({ page }, info) => {
  test.skip(info.project.name !== 'tablet', 'gemessen am 1024er-Tablet');
  await oeffnen(page, '/');
  await expect(page.locator('.kuechen-katze-ebene')).toHaveAttribute('data-ebenen', /boden-/);
  const treffer = await page.evaluate(() => {
    const ebenen = JSON.parse(document.querySelector('.kuechen-katze-ebene').dataset.ebenen);
    const boeden = ebenen.filter(([id]) => id.startsWith('boden-'));
    const raus = [];
    for (const [id, links, rechts, boden] of boeden) {
      const f = { left: links, right: rechts, top: boden - 100, bottom: boden };
      for (const el of document.querySelectorAll('button, input, select, .button-group, .side-rail > *')) {
        if (el.closest('.kuechen-katze-ebene')) continue;
        const b = el.getBoundingClientRect();
        if (b.width && f.left < b.right && f.right > b.left && f.top < b.bottom && f.bottom > b.top) raus.push(`${id} ⨯ ${el.className || el.tagName}`);
      }
    }
    return { anzahl: boeden.length, raus };
  });
  expect(treffer.anzahl).toBeGreaterThan(0);
  expect(treffer.raus).toEqual([]);
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
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 10 %');
  // Trockenfutter: 3 Münzen, +20 in den Napf
  await page.locator('.zimmer-karte', { hasText: 'Trockenfutter' }).locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 30 %');
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
  await oeffnen(page, '/', { cat_coinCount: 0, zimmer_napf: 0 });
  await page.locator('.kuechen-karte').click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Füttern/ }).click();
  const karte = page.locator('.zimmer-karte', { hasText: 'Notration' });
  await karte.locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 20 %');
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

/* ── Etappe 6: Herzen schalten Verhalten frei ─────────────────────────── */
test('neues Herz: Feier mit dem, was jetzt neu ist – einmal', async ({ page }) => {
  await zimmerAuf(page, { zimmer_herzen_gesehen: 0, cat_freundschaft: 25, zimmer_geschenk: schichtTag(0) });
  const feier = page.getByRole('dialog', { name: 'Neues Herz' });
  await expect(feier).toContainText('2 neue Herzen');
  await expect(feier).toContainText('Begrüssung');
  await expect(feier).toContainText('Bauch zeigen');
  await feier.getByRole('button').click();
  await expect(feier).toHaveCount(0);
  // gemerkt – kein Neuladen, das Init-Skript des Tests setzte den Wert sonst zurück
  expect(await page.evaluate(() => localStorage.getItem('zimmer_herzen_gesehen'))).toBe('2');
});

test('Freundschaft: Tipp auf die Herzen zeigt, was jedes Herz bringt', async ({ page }) => {
  await zimmerAuf(page, { cat_freundschaft: 25, zimmer_geschenk: schichtTag(0) });
  await page.getByRole('button', { name: /von 5 Herzen/ }).click();
  await expect(page.locator('[data-freischaltung="rollen"]')).toContainText('frei');
  await expect(page.locator('[data-freischaltung="zweitesGeschenk"]')).toContainText('noch zu');
});

test('Bauch zeigen (zweites Herz): Streicheln lässt sie sich rollen', async ({ page }) => {
  await zimmerAuf(page, { cat_freundschaft: 25, zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-katze').dispatchEvent('click');
  await expect(page.locator('.zimmer-katze')).toHaveClass(/rollt/);
});

/* ── Etappe 7: Tageszeit, Fensterbesuch, Fundstücke ───────────────────── */
test('Tageszeit: nachts Mond und Lampe an, mittags Sonne und Lampe aus', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-06T22:30:00') });
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0) });
  await expect(page.locator('[data-gestirn="mond"]')).toBeAttached();
  await expect(page.locator('[data-lampe="an"]')).toBeAttached();
  await page.clock.setFixedTime(new Date('2026-10-07T12:00:00'));
  await page.clock.runFor(61_000);
  await expect(page.locator('[data-gestirn="sonne"]')).toBeAttached();
  await expect(page.locator('[data-lampe="aus"]')).toBeAttached();
});

test('Fensterbesuch: nach spätestens einer Minute schaut jemand vorbei', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-06T12:00:00') });
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0) });
  // Er bleibt nur 7 s – also sekundenweise schauen, ob er in der ersten Minute kam
  let gesehen = false;
  for (let t = 0; t < 61 && !gesehen; t += 1) {
    await page.clock.runFor(1000);
    gesehen = (await page.locator('[data-besuch]').count()) === 1;
  }
  expect(gesehen).toBe(true);
});

test('Fundstück: aufheben bringt es ins Album und 5 Münzen', async ({ page }) => {
  await zimmerAuf(page, {
    zimmer_geschenk: schichtTag(0), cat_freundschaft: 100,
    zimmer_fund: JSON.stringify({ gewuerfelt: schichtTag(0), gefunden: [], offen: 'murmel' }),
  });
  await page.getByRole('button', { name: 'Fundstück aufheben' }).dispatchEvent('click');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Murmel – neu im Album');
  await expect(page.locator('.zimmer-geld')).toContainText('505');
  await page.getByRole('button', { name: /von 5 Herzen/ }).click();
  await expect(page.locator('[data-album="murmel"]')).toContainText('Murmel');
  await expect(page.locator('[data-album="korken"]')).toContainText('?');
});

/* ── 2.1.0: randlos ───────────────────────────────────────────────────── */
test('Zimmer randlos: die Szene deckt den ganzen Bildschirm, auch breiter als 4:3', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0) });
  // Erst messen, wenn das Zimmer fertig eingeblendet ist (startet bei 98,5 %)
  await page.waitForFunction(() => document.querySelector('.zimmer').getAnimations().every((a) => a.playState === 'finished'));
  const m = await page.evaluate(() => {
    const r = document.querySelector('.zimmer-szene').getBoundingClientRect();
    const menue = document.querySelector('.zimmer-menue').getBoundingClientRect();
    return { l: r.left, r: r.right, t: r.top, b: r.bottom, ml: menue.left, mr: menue.right, mb: menue.bottom, w: innerWidth, h: innerHeight };
  });
  expect(m.l).toBeLessThanOrEqual(0.5);
  expect(m.r).toBeGreaterThanOrEqual(m.w - 0.5);
  expect(m.t).toBeLessThanOrEqual(0.5);
  expect(m.b).toBeGreaterThanOrEqual(m.h - 0.5);
  // Menüleiste von Rand zu Rand, unten bündig
  expect(m.ml).toBeLessThanOrEqual(0.5);
  expect(m.mr).toBeGreaterThanOrEqual(m.w - 0.5);
  expect(Math.abs(m.mb - m.h)).toBeLessThan(1);
});

test('Vollbild-Knopf ist da', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0) });
  await expect(page.getByRole('button', { name: 'Vollbild' })).toBeVisible();
});

/* ── 2.4.0: Regal, Ball, Katzengras, Wetter ───────────────────────────── */
import { wetter } from '../src/zimmer/tageszeit.js';

const mitAllem = { zimmer_geschenk: '2026-10-07|1', cat_besitz: JSON.stringify(['wandregal', 'katzengras', 'ball']) };
const katzeZiel = (page) => page.locator('.zimmer-katze').evaluate((k) => k.getAttribute('style'));

test('Regal: sie springt hinauf (Bogen) und sitzt oben', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-07T12:00:00') });
  await zimmerAuf(page, mitAllem);
  let oben = false;
  for (let i = 0; i < 200 && !oben; i += 1) {
    await page.clock.runFor(3_000);
    oben = await page.locator('.zimmer-katze.tut-regal').count() > 0;
  }
  expect(oben).toBe(true);
  // Ziel des Übergangs: Füsse auf dem Regalbrett (y 250 → translate-y 112)
  expect(await katzeZiel(page)).toMatch(/translate\([^,]+,\s*112px\)/);
});

test('Ball: nach einem Stupser rollt er an eine neue Stelle', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-07T12:00:00') });
  await zimmerAuf(page, { ...mitAllem, zimmer_ball: JSON.stringify({ x: 700, y: 650 }) });
  const ball = page.locator('[data-moebel="ball"]');
  await expect(ball).toBeAttached();
  const vorher = await ball.getAttribute('style');
  let gerollt = false;
  for (let i = 0; i < 200 && !gerollt; i += 1) {
    await page.clock.runFor(3_000);
    gerollt = (await ball.getAttribute('style')) !== vorher;
  }
  expect(gerollt).toBe(true);
});

test('Wetter: das Fenster zeigt das Wetter des Tages', async ({ page }) => {
  // Einen Tag suchen, an dem es nicht einfach sonnig ist
  let tag = new Date('2026-10-01T12:00:00');
  for (let i = 0; i < 40 && wetter(tag) === 'sonne'; i += 1) tag = new Date(tag.getTime() + 86_400_000);
  const art = wetter(tag);
  await page.clock.install({ time: tag });
  await zimmerAuf(page, mitAllem);
  await expect(page.locator(`[data-wetter="${art}"]`)).toBeAttached();
});

/* ── 2.5.0: Näpfe mit sichtbarem Füllstand, Wasserschale zum Auffüllen ─ */
test('Näpfe zeigen den Füllstand in vier Stufen', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0), zimmer_napf: 40, zimmer_wasser: 25 });
  await expect(page.locator('[data-moebel="napf"]')).toHaveAttribute('data-fuellung', '40');
  await expect(page.locator('[data-moebel="napf"] [data-stufen]')).toHaveAttribute('data-stufen', '2');
  await expect(page.locator('[data-moebel="wassernapf"] [data-stufen]')).toHaveAttribute('data-stufen', '1');
});

test('Wasser leer: die Karte sagt es, ein Tipp auf die Schale füllt sie kostenlos', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_wasser: 0, zimmer_geschenk: schichtTag(0) });
  await expect(page.locator('.kuechen-karte')).toContainText('Wasser leer');
  await page.locator('.kuechen-karte').click();
  await page.getByRole('button', { name: /Wasserschale, 0 % voll/ }).dispatchEvent('click');
  await expect(page.locator('[data-moebel="wassernapf"]')).toHaveAttribute('data-fuellung', '100');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Frisches Wasser');
  await expect(page.locator('.zimmer-geld')).toContainText('500');
});

test('Futternapf antippen öffnet Füttern', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0), zimmer_napf: 10 });
  await page.getByRole('button', { name: /Futternapf/ }).dispatchEvent('click');
  await expect(page.locator('.zimmer-blatt')).toContainText('Napf 10 %');
});

test('Küchenkatze: bei halbleerer Schale bietet sie auch Wasser an', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_wasser: 50 });
  await page.locator('.kuechen-katze').dispatchEvent('click');
  await page.getByRole('group', { name: /was tun/ }).getByRole('button', { name: 'Wasser' }).dispatchEvent('click');
  await expect(page.locator('.kuechen-katze-spruch')).toContainText('Frisches Wasser');
  expect(await page.evaluate(() => localStorage.getItem('zimmer_wasser'))).toBe('100');
});
