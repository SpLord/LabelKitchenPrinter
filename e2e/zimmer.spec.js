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

test('Leckerli fangen: danach fünf Minuten Pause, dann wieder frei', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-12T12:00:00') });
  await spielenOeffnen(page, { zimmer_geschenk: '2026-10-12|1' });
  await page.locator('.zimmer-karte', { hasText: 'Leckerli fangen' }).locator('.zimmer-preis').click();
  await expect(page.locator('.zimmer-spiel')).toBeVisible();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
  const karte = page.locator('.zimmer-karte', { hasText: 'Leckerli fangen' });
  await expect(karte.locator('.zimmer-preis')).toBeDisabled();
  await expect(karte).toContainText('wieder in 5 min');
  // Nach fünf Minuten ist es wieder frei (die Karte rechnet beim Öffnen neu)
  await page.keyboard.press('Escape');
  await expect(page.locator('.zimmer-blatt')).toHaveCount(0);
  await page.clock.runFor(5 * 60_000 + 1000);
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
  await expect(page.locator('.zimmer-karte', { hasText: 'Leckerli fangen' }).locator('.zimmer-preis')).toBeEnabled();
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

/* ── 2.6.0: Etiketten-Münzen und Tagesaufgaben ────────────────────────── */
import { AUFGABEN, aufgabenFuer } from '../src/zimmer/aufgaben.js';

test('Etiketten-Münzen: ein gedrucktes Etikett bringt eine Münze', async ({ page }) => {
  await oeffnen(page, '/', { zimmer_geschenk: schichtTag(0) });
  await page.getByRole('button', { name: /^Steak/ }).first().click();
  await warteAufDrucke(page, 1);
  await expect(page.locator('.kuechen-karte')).toContainText('501');
  await expect(page.locator('.kuechen-katze-muenze')).toBeAttached();
});

test('Aufgaben: drei für heute, erfüllte lassen sich einmal abholen', async ({ page }) => {
  const tag = schichtTag(0);
  const ids = aufgabenFuer(tag);
  const a = AUFGABEN[ids[0]];
  await zimmerAuf(page, {
    zimmer_geschenk: tag,
    zimmer_aufgaben: JSON.stringify({ tag, zaehler: { [a.zaehlt]: a.ziel }, abgeholt: [] }),
  });
  const knopf = page.getByRole('button', { name: /Aufgaben für heute/ });
  await expect(knopf).toContainText('1');
  await knopf.click();
  await expect(page.locator('[data-aufgabe]')).toHaveCount(3);
  const erste = page.locator(`[data-aufgabe="${ids[0]}"]`);
  await erste.getByRole('button', { name: /abholen/ }).click();
  await expect(page.locator('.zimmer-geld')).toContainText(String(500 + a.lohn));
  await expect(erste).toContainText('erledigt');
});

/* ── 2.7.0: mehr Verhalten ────────────────────────────────────────────── */
test('Sonnenfleck: an sonnigen Tagen liegt er auf dem Boden, nachts nicht', async ({ page }) => {
  let tag = new Date('2026-10-01T12:00:00');
  for (let i = 0; i < 40 && wetter(tag) !== 'sonne'; i += 1) tag = new Date(tag.getTime() + 86_400_000);
  await page.clock.install({ time: tag });
  await zimmerAuf(page, { zimmer_geschenk: '2026-10-01|1' });
  await expect(page.locator('[data-sonnenfleck]')).toBeAttached();
  await page.clock.setFixedTime(new Date(tag.getTime() + 11 * 3_600_000));   // 23 Uhr
  await page.clock.runFor(61_000);
  await expect(page.locator('[data-sonnenfleck]')).toHaveCount(0);
});

/* ── 2.8.0: Laserpointer, Versteckspiel, Memory ───────────────────────── */
test('Spielen bietet jetzt dreizehn Spiele', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  for (const n of ['Federangel', 'Leckerli fangen', 'Mäuseloch', 'Hütchenspiel', 'Laserpointer', 'Versteckspiel', 'Memory',
    'Seifenblasen', 'Nachmachen', 'Apportieren', 'Gurkenhüpfer', 'Leckerli-Reise', 'Angeln']) {
    await expect(page.locator('.zimmer-karte', { hasText: n })).toHaveCount(1);
  }
});

test('Laserpointer: Punkt folgt dem Finger, Fertig beendet mit Meldung', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Laserpointer' }).locator('.zimmer-preis').click();
  const flaeche = await page.locator('.zimmer-spiel').boundingBox();
  await page.mouse.move(flaeche.x + flaeche.width * 0.3, flaeche.y + flaeche.height * 0.85);
  await expect(page.locator('[data-laser]')).toHaveAttribute('transform', /translate\(/);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-ergebnis')).toBeVisible();
});

test('Versteckspiel: der Schwanz verrät sie, gleich gefunden bringt Münzen', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-09T12:00:00') });
  await spielenOeffnen(page, { zimmer_geschenk: '2026-10-09|1' });
  await page.locator('.zimmer-karte', { hasText: 'Versteckspiel' }).locator('.zimmer-preis').click();
  await page.clock.runFor(3_500);
  const richtig = page.locator('g:has(> .zimmer-versteck-schwanz) > [data-versteck]');
  await expect(richtig).toHaveCount(1);
  await richtig.dispatchEvent('pointerdown');
  await expect(page.locator('.zimmer-spiel-hud')).toContainText('1 gefunden');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-geld')).toContainText('503');
  // Danach fünf Minuten Pause
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
  await expect(page.locator('.zimmer-karte', { hasText: 'Versteckspiel' }).locator('.zimmer-preis')).toBeDisabled();
});

test('Memory: alle Paare finden bringt Münzen', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Memory' }).locator('.zimmer-preis').click();
  // Erst alle Bilder kennenlernen (Paare 0+1, 2+3 …), dann gezielt zuordnen
  const bilder = [];
  for (let i = 0; i < 12; i += 2) {
    await page.locator(`[data-karte="${i}"]`).click();
    bilder[i] = await page.locator(`[data-karte="${i}"]`).getAttribute('aria-label');
    await page.locator(`[data-karte="${i + 1}"]`).click();
    bilder[i + 1] = await page.locator(`[data-karte="${i + 1}"]`).getAttribute('aria-label');
    await page.waitForTimeout(950);
  }
  for (let i = 0; i < 12; i += 1) {
    if (await page.locator(`[data-karte="${i}"].gefunden`).count()) continue;
    const j = bilder.findIndex((b, k) => k !== i && b === bilder[i]);
    await page.locator(`[data-karte="${i}"]`).click();
    await page.locator(`[data-karte="${j}"]`).click();
    await page.waitForTimeout(150);
  }
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Alle Paare');
  const stand = Number((await page.locator('.zimmer-geld').innerText()).replace(/\D/g, ''));
  expect(stand).toBeGreaterThan(500);
});

/* ── 2.9.0: Karton, Teppich, Aquarium ─────────────────────────────────── */
test('Einrichten: Karton, Teppich und Aquarium lassen sich kaufen und stehen im Zimmer', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0), cat_coinCount: 1000 });
  for (const id of ['karton', 'teppich', 'aquarium']) {
    await page.locator('.zimmer-menue').getByRole('button', { name: /Einrichten/ }).click();
    await page.locator(`.zimmer-karte[data-artikel="${id}"]`).locator('.zimmer-preis').click();
    await expect(page.locator(`[data-moebel="${id}"]`).first()).toBeAttached();
  }
  await expect(page.locator('.zimmer-geld')).toContainText(String(1000 - 60 - 180 - 500));
});

test('Karton: sitzt sie drin, liegt die Vorderwand vor ihr', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-09T12:00:00') });
  await zimmerAuf(page, { zimmer_geschenk: '2026-10-09|1', cat_besitz: JSON.stringify(['karton']) });
  let drin = false;
  for (let i = 0; i < 200 && !drin; i += 1) {
    await page.clock.runFor(3_000);
    drin = await page.locator('[data-im-karton]').count() > 0;
  }
  expect(drin).toBe(true);
  await expect(page.locator('.zimmer-katze')).toHaveClass(/tut-karton/);
});

/* ── 2.10.0: drei Spiele, Interaktionen, Animationen ────────────────────── */
/* Szenenpunkt (1024 × 768) → Bildschirmpunkt, auch im randlosen Ausschnitt */
const aufBildschirm = (page, x, y) => page.evaluate(([sx, sy]) => {
  const p = new DOMPoint(sx, sy).matrixTransform(document.querySelector('.zimmer-szene').getScreenCTM());
  return { x: p.x, y: p.y };
}, [x, y]);

test('Seifenblasen: antippen lässt sie platzen, Fertig meldet es', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Seifenblasen' }).locator('.zimmer-preis').click();
  const blase = page.locator('[data-blase]').first();
  await expect(blase).toBeAttached();
  await blase.dispatchEvent('pointerdown');
  await expect(page.locator('.zimmer-spiel-hud')).toContainText('1 geplatzt');
  await expect(page.locator('[data-geplatzt]')).toBeAttached();
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-ergebnis')).toContainText('geplatzt');
});

test('Nachmachen: sie zeigt ein Kissen, richtig nachgemacht bringt Münzen', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Nachmachen' }).locator('.zimmer-preis').click();
  // Welches Kissen leuchtet, während sie vorzeigt?
  const an = page.locator('[data-kissen]:has(.leuchtet)');
  await expect(an).toHaveCount(1);
  const k = await an.getAttribute('data-kissen');
  await expect(page.locator('[data-nachmachen-phase="nachmachen"]')).toBeVisible();
  await page.locator(`[data-kissen="${k}"]`).dispatchEvent('pointerdown');
  await expect(page.locator('.zimmer-spiel-hud')).toContainText('Runde 2');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-ergebnis')).toContainText('+2 Münzen');
  await expect(page.locator('.zimmer-geld')).toContainText('502');
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
  await expect(page.locator('.zimmer-karte', { hasText: 'Nachmachen' }).locator('.zimmer-preis')).toBeDisabled();
});

test('Nachmachen: falsches Kissen beendet das Spiel ohne Münzen', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Nachmachen' }).locator('.zimmer-preis').click();
  const an = page.locator('[data-kissen]:has(.leuchtet)');
  await expect(an).toHaveCount(1);
  const k = Number(await an.getAttribute('data-kissen'));
  await expect(page.locator('[data-nachmachen-phase="nachmachen"]')).toBeVisible();
  await page.locator(`[data-kissen="${(k + 1) % 4}"]`).dispatchEvent('pointerdown');
  await expect(page.locator('.zimmer-ergebnis')).toContainText('war zu schnell');
  await expect(page.locator('.zimmer-geld')).toContainText('500');
});

test('Apportieren: geworfenes Knäuel holt sie und bringt es zurück', async ({ page }) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('.zimmer-karte', { hasText: 'Apportieren' }).locator('.zimmer-preis').click();
  const p = await aufBildschirm(page, 300, 620);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-wolle="holt"]')).toBeAttached();
  await expect(page.locator('.zimmer-spiel-hud')).toContainText('1-mal gebracht', { timeout: 15_000 });
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-ergebnis')).toContainText('gebracht');
});

test('Locken: Tipp auf den Boden – sie kommt hin und legt den Kopf schief', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0) });
  const p = await aufBildschirm(page, 260, 600);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-tipp]')).toBeAttached();
  await expect(page.locator('.zimmer-katze')).toHaveClass(/tut-kopfschief/);
  const da = await page.evaluate(() => document.querySelector('.zimmer-katze').style.transform);
  // Ziel 260/600 → translate(260 − 75, 600 − 150 + 12); der Mausklick rundet auf Bildschirmpixel
  const [x, y] = da.match(/-?[\d.]+/g).map(Number);
  expect(Math.abs(x - 185)).toBeLessThanOrEqual(2);
  expect(Math.abs(y - 462)).toBeLessThanOrEqual(2);
});

test('Fenster antippen: jemand kommt vorbei, sie springt hin und schnattert', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0) });
  await page.locator('[data-fenster]').click();
  await expect(page.locator('[data-besuch]')).toBeAttached();
  await expect(page.locator('.zimmer-katze')).toHaveClass(/tut-schnattern/);
  await expect(page.locator('[data-sagt="schnattern"]')).toBeAttached({ timeout: 8_000 });
});

test('Kuscheln: lange drücken lässt sie schnurren und treteln', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0) });
  const katze = page.locator('.zimmer-katze');
  await katze.dispatchEvent('pointerdown');
  await expect(page.locator('[data-schnurrt]')).toBeAttached();
  await katze.dispatchEvent('pointerup');
  await expect(katze).toHaveClass(/tut-treteln/);
});

test('Aquarium antippen: die Fische flitzen, sie kommt gucken', async ({ page }) => {
  await zimmerAuf(page, { zimmer_geschenk: schichtTag(0), cat_besitz: JSON.stringify(['aquarium']) });
  await page.locator('[aria-label="Ans Aquarium tippen"]').click();
  await expect(page.locator('.fische-erschreckt')).toBeAttached();
  await expect(page.locator('.zimmer-katze')).toHaveClass(/tut-fische/);
});

/* ── 2.12.0: Gurkenhüpfer, Leckerli-Drei, Angeln; Pause fünf Minuten ──── */
const spielStarten = async (page, name, werte = {}) => {
  await spielenOeffnen(page, { zimmer_geschenk: schichtTag(0), ...werte });
  // Leckerli-Drei ist seit 2.13.0 das freie Spiel auf der Karte der Leckerli-Reise
  const karte = page.locator('.zimmer-karte', { hasText: name === 'Leckerli-Drei' ? 'Leckerli-Reise' : name });
  await karte.scrollIntoViewIfNeeded();
  if (name === 'Leckerli-Drei') await karte.getByRole('button', { name: 'freies Spiel' }).click();
  else if (name === 'Leckerli-Reise') await karte.getByRole('button', { name: 'Reise' }).click();
  else await karte.locator('.zimmer-preis').click();
};

test('Gurkenhüpfer: Tipp startet, Tippen springt, an der Gurke ist Schluss', async ({ page }) => {
  await spielStarten(page, 'Gurkenhüpfer');
  const spiel = page.locator('.zimmer-spiel-huepfer');
  await expect(spiel).toHaveAttribute('data-huepfer', 'bereit');
  // Die Zimmerkatze ist weg, im Flur rennt ihre eigene
  await expect(page.locator('.zimmer')).toHaveClass(/katze-versteckt/);
  // Ein Sprung dauert keine Sekunde – also jedes Bild mitschauen, wie hoch sie kommt
  const hoechste = page.evaluate(() => new Promise((fertig) => {
    let max = 0; const bis = performance.now() + 1500;
    const blick = () => {
      const k = document.querySelector('[data-huepfer-katze]');
      max = Math.max(max, Number(k?.dataset.huepferKatze ?? 0));
      if (performance.now() < bis) requestAnimationFrame(blick); else fertig(max);
    };
    requestAnimationFrame(blick);
  }));
  await spiel.dispatchEvent('pointerdown');
  await expect(spiel).toHaveAttribute('data-huepfer', 'laeuft');
  expect(await hoechste).toBeGreaterThan(60);
  // Danach nicht mehr tippen – die nächste Gurke beendet den Lauf
  await expect(spiel).toHaveAttribute('data-huepfer', 'vorbei', { timeout: 15_000 });
  await expect(page.locator('.zimmer-ergebnis')).toContainText('m gerannt');
  await page.locator('.zimmer-menue').getByRole('button', { name: /Spielen/ }).click();
  await expect(page.locator('.zimmer-karte', { hasText: 'Gurkenhüpfer' }).locator('.zimmer-preis')).toBeDisabled();
});

/* Einen Tausch suchen, der drei Gleiche ergibt – aus den Arten im DOM */
const dreierZug = (page) => page.evaluate(() => {
  const n = 7;
  const art = [...document.querySelectorAll('[data-feld]')].sort((a, b) => a.dataset.feld - b.dataset.feld).map((e) => e.dataset.art);
  const leckerli = (x) => ['fisch', 'keks', 'maus', 'wolle', 'feder', 'milch'].includes(x);
  const passt = (b) => {
    for (let i = 0; i < n * n; i += 1) {
      const z = Math.floor(i / n); const s = i % n;
      if (!leckerli(b[i])) continue;
      if (s <= n - 3 && b[i] === b[i + 1] && b[i] === b[i + 2]) return true;
      if (z <= n - 3 && b[i] === b[i + n] && b[i] === b[i + 2 * n]) return true;
    }
    return false;
  };
  for (let i = 0; i < n * n; i += 1) {
    for (const j of [i % n < n - 1 ? i + 1 : -1, i + n < n * n ? i + n : -1]) {
      if (j < 0 || art[i] === 'kiste' || art[j] === 'kiste' || art[i] === 'dose' && art[j] === 'dose') continue;
      if (art[i] === 'regen' || art[j] === 'regen') return [i, j];
      const b = [...art]; [b[i], b[j]] = [b[j], b[i]];
      if (passt(b)) return [i, j];
    }
  }
  return null;
});

test('Leckerli-Drei: ein passender Tausch bringt Punkte und kostet einen Zug', async ({ page }) => {
  await spielStarten(page, 'Leckerli-Drei');
  await expect(page.locator('[data-feld]')).toHaveCount(49);
  const [a, b] = await dreierZug(page);
  await page.locator(`[data-feld="${a}"]`).click();
  await expect(page.locator('.dreier-feld.gewaehlt')).toHaveCount(1);
  await page.locator(`[data-feld="${b}"]`).click();
  await expect(page.locator('[data-dreier-beschaeftigt="0"]')).toBeAttached();
  await expect(page.locator('.zimmer-spiel-hud strong').first()).not.toHaveText('0');
  const zuege = Number(await page.locator('[data-dreier-zuege]').getAttribute('data-dreier-zuege'));
  expect(zuege).toBe(19);
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Punkte');
});

test('Leckerli-Drei: ein Tausch ohne Reihe zählt nicht', async ({ page }) => {
  await spielStarten(page, 'Leckerli-Drei');
  // Suche ein Nachbarpaar, das nichts ergibt
  const paar = await page.evaluate(() => {
    const n = 7;
    const art = [...document.querySelectorAll('[data-feld]')].sort((a, b) => a.dataset.feld - b.dataset.feld).map((e) => e.dataset.art);
    const passt = (b) => b.some((_, i) => (i % n <= n - 3 && b[i] === b[i + 1] && b[i] === b[i + 2])
      || (Math.floor(i / n) <= n - 3 && b[i] === b[i + n] && b[i] === b[i + 2 * n]));
    for (let i = 0; i < n * n - 1; i += 1) {
      if (i % n === n - 1) continue;
      const b = [...art]; [b[i], b[i + 1]] = [b[i + 1], b[i]];
      if (!passt(b)) return [i, i + 1];
    }
    return null;
  });
  await page.locator(`[data-feld="${paar[0]}"]`).click();
  await page.locator(`[data-feld="${paar[1]}"]`).click();
  await expect(page.locator('[data-dreier-beschaeftigt="0"]')).toBeAttached();
  await expect(page.locator('[data-dreier-zuege]')).toHaveAttribute('data-dreier-zuege', '20');
});

test('Angeln: Tipp wirft den Haken, er kommt zurück; die Zeit läuft', async ({ page }) => {
  await spielStarten(page, 'Angeln');
  const spiel = page.locator('.zimmer-spiel-angeln');
  await expect(spiel).toHaveAttribute('data-angel', 'pendelt');
  await expect(page.locator('[data-fisch]')).toHaveCount(8);
  await spiel.dispatchEvent('pointerdown');
  await expect(spiel).toHaveAttribute('data-angel', /raus|zieht|zurueck/);
  await expect(spiel).toHaveAttribute('data-angel', 'pendelt', { timeout: 10_000 });
  await expect(page.locator('.zimmer-spiel-zeit')).not.toHaveText('60 s');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.locator('.zimmer-ergebnis')).toContainText('Punkte');
});

/* ── 2.13.0: Leckerli-Reise ──────────────────────────────────────────── */
const reiseSpielen = async (page, maxZuege = 25) => {
  for (let k = 0; k < maxZuege; k += 1) {
    if (await page.locator('[data-reise-phase="spiel"]').count() === 0) return;
    const [a, b] = await dreierZug(page);
    await page.locator(`[data-feld="${a}"]`).click();
    await page.locator(`[data-feld="${b}"]`).click();
    await expect(page.locator('[data-dreier-beschaeftigt="0"]')).toBeAttached({ timeout: 20_000 });
  }
};

test('Leckerli-Reise: Karte mit Level 1 offen, Level 2 gesperrt; zurück ins Zimmer', async ({ page }) => {
  await spielStarten(page, 'Leckerli-Reise');
  await expect(page.locator('[data-reise-karte="kueche"]')).toBeVisible();
  await expect(page.locator('[data-station]')).toHaveCount(10);
  await expect(page.locator('[data-station="1"]')).toHaveClass(/offen/);
  await expect(page.locator('[data-station="2"]')).toHaveClass(/zu/);
  await expect(page.getByRole('button', { name: /Garten/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Zurück ins Zimmer' }).click();
  await expect(page.locator('.reise')).toHaveCount(0);
  await expect(page.locator('.zimmer-menue')).toBeVisible();
});

test('Leckerli-Reise: Level 1 schaffen bringt Sterne, Münzen und schaltet Level 2 frei', async ({ page }) => {
  test.setTimeout(150_000);
  await spielStarten(page, 'Leckerli-Reise');
  await page.locator('[data-station="1"]').click();
  // Startbild: Ziel und Tipp
  await expect(page.locator('.reise-tafel')).toContainText('600 Punkte');
  await expect(page.locator('.reise-tipp')).toBeVisible();
  await page.getByRole('button', { name: 'Los!' }).click();
  await reiseSpielen(page);
  await expect(page.locator('.reise-tafel.gewonnen')).toBeVisible({ timeout: 10_000 });
  const lohn = Number(await page.locator('[data-reise-lohn]').getAttribute('data-reise-lohn'));
  expect(lohn).toBeGreaterThanOrEqual(7);
  await expect(page.locator('.zimmer-geld')).toContainText(String(500 + lohn));
  // Nochmal genauso gut: keine Münzen mehr
  await page.getByRole('button', { name: 'Karte' }).last().click();
  await expect(page.locator('[data-station="2"]')).toHaveClass(/offen/);
  await expect(page.locator('[data-station="1"]')).toHaveClass(/geschafft/);
  const gespeichert = await page.evaluate(() => JSON.parse(localStorage.getItem('zimmer_reise')));
  expect(gespeichert.sterne[1]).toBeGreaterThanOrEqual(1);
});

test('Leckerli-Reise: gespeicherter Fortschritt öffnet die Welt, Startbild zeigt Kisten-Ziel', async ({ page }) => {
  const sterne = Object.fromEntries(Array.from({ length: 10 }, (_, k) => [k + 1, 2]));
  await spielStarten(page, 'Leckerli-Reise', { zimmer_reise: JSON.stringify({ sterne, rekord: {} }) });
  // Nächstes Level liegt im Garten – dort öffnet die Karte
  await expect(page.locator('[data-reise-karte="garten"]')).toBeVisible();
  await expect(page.locator('.reise-gesamt')).toContainText('20 / 90');
  await page.locator('[data-station="11"]').click();
  await expect(page.locator('.reise-tafel')).toContainText('Alle Kisten kaputt');
  await page.getByRole('button', { name: 'Los!' }).click();
  await expect(page.locator('[data-art="kiste"]')).toHaveCount(7);
  await expect(page.locator('[data-ziel="kisten"]')).toContainText('0 / 7');
  await page.getByRole('button', { name: 'Karte' }).click();
  await expect(page.locator('[data-reise-karte]')).toBeVisible();
});

test('Leckerli-Reise: Pfützen liegen unter dem Brett', async ({ page }) => {
  const sterne = Object.fromEntries(Array.from({ length: 5 }, (_, k) => [k + 1, 1]));
  await spielStarten(page, 'Leckerli-Reise', { zimmer_reise: JSON.stringify({ sterne, rekord: {} }) });
  await page.locator('[data-station="6"]').click();
  await page.getByRole('button', { name: 'Los!' }).click();
  await expect(page.locator('[data-pfuetze]')).toHaveCount(14);
  await expect(page.locator('[data-ziel="pfuetzen"]')).toContainText('0 / 14');
});
