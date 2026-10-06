import { test, expect, grundaufbau } from './hilfen.js';

/*
  Die Katze liegt über der Bedienung und hat pointer-events: auto. Stand sie
  auf einem Etikettenknopf, streichelte der Tipp sie, und das Etikett wurde
  nicht gedruckt (gemessen: in 4 von 10 Seitenaufrufen stand sie auf einem
  Bedienelement).

  Die Katze lässt sich nicht positionieren – ihre Animationsschleife
  überschreibt jeden Versuch. Deshalb wandert hier der KNOPF: Er wird genau
  unter die aktuelle Katzenposition gelegt.
*/
const mitKatze = async (page, werte = {}) => {
  await grundaufbau(page);
  await page.addInitScript((w) => {
    try { for (const [k, v] of Object.entries(w)) localStorage.setItem(k, String(v)); } catch { /* gesperrt */ }
  }, {
    cat_coinCount: 900, cat_coinPeak: 1410, cat_lastSeen: Date.now(), cat_fwDone: '1',
    cat_hunger: 90, cat_thirst: 90, cat_freude: 40, ...werte,
  });
  await page.goto('/?alt');
  await page.waitForSelector('.status-indicator .online');
  await page.locator('.cat-sprite svg').first().waitFor();
};

/*
  Legt in EINEM Schritt (Katze bewegt sich nicht dazwischen) einen Knopf unter
  die Katze und liefert deren Mitte. Optional werden alle echten Bedienelemente
  für Zeigerereignisse stillgelegt, damit unter der Katze sicher freie Fläche ist.
*/
const unterDieKatze = (page, { knopf }) => page.evaluate((mitKnopf) => {
  const r = document.querySelector('.cat-sprite svg').getBoundingClientRect();
  /*
    Nicht blind die Mitte: Die Kopfleiste liegt ÜBER der Katze. Steht sie
    darunter, träfe der Tipp die Leiste und nie die Katze – das wäre ein
    Messfehler, kein Katzenfehler. Gesucht wird ein Punkt, an dem die Katze
    oben liegt.
  */
  let ziel = null;
  for (let i = 1; i <= 7 && !ziel; i += 1) {
    for (let j = 1; j <= 7 && !ziel; j += 1) {
      const px = r.left + (r.width * i) / 8;
      const py = r.top + (r.height * j) / 8;
      if (document.elementsFromPoint(px, py)[0]?.closest('.cat-sprite')) ziel = { x: px, y: py };
    }
  }
  if (!ziel) throw new Error('Katze liegt vollständig unter anderen Elementen');
  const { x, y } = ziel;
  window.__knopfKlicks = 0;
  document.getElementById('testknopf')?.remove();
  if (mitKnopf) {
    const b = document.createElement('button');
    b.id = 'testknopf';
    b.textContent = 'Test';
    b.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:39;`;
    b.addEventListener('click', () => { window.__knopfKlicks += 1; });
    document.body.appendChild(b);
  } else {
    document.querySelectorAll('button, a, input, select, textarea, label, [role=button], .react-datepicker').forEach((e) => {
      if (!e.closest('.cat-sprite')) e.style.pointerEvents = 'none';
    });
  }
  return { x, y };
}, knopf);

/*
  Ohne Spiel springt die Katze von Zeit zu Zeit an eine neue Stelle. Springt sie
  zwischen Messen und Tippen, geht der Tipp ins Leere – kein Fehler der Katze,
  sondern der Messung. Darum wird Messen+Tippen als Einheit wiederholt, bis die
  erwartete Wirkung eintritt (ein verfehlter Tipp ändert nichts am Ergebnis).
*/
const tippeAufKatze = (page, optionen, wirkung) =>
  expect(async () => {
    const { x, y } = await unterDieKatze(page, optionen);
    await page.mouse.click(x, y);
    await wirkung();
  }).toPass({ timeout: 15_000 });

test('Tipp auf die Katze erreicht den Knopf darunter und streichelt nicht', async ({ page }) => {
  await mitKatze(page);
  const freude = () => page.evaluate(() => Number(localStorage.getItem('cat_freude')));
  const vor = await freude();

  await tippeAufKatze(page, { knopf: true }, () =>
    expect.poll(() => page.evaluate(() => window.__knopfKlicks), { timeout: 1_000 }).toBe(1));
  // Nicht gestreichelt: keine Spruchblase, Zufriedenheit unverändert
  await expect(page.locator('.cat-bubble')).toHaveCount(0);
  expect(await freude()).toBe(vor);
});

test('Tipp auf die Katze über freier Fläche streichelt weiterhin', async ({ page }) => {
  await mitKatze(page);
  const freude = () => page.evaluate(() => Number(localStorage.getItem('cat_freude')));
  const vor = await freude();

  await tippeAufKatze(page, { knopf: false }, () =>
    expect.poll(freude, { timeout: 1_000 }).toBeGreaterThan(vor));
  await expect(page.locator('.cat-bubble')).toBeVisible();
});
