import { test, expect, grundaufbau } from './hilfen.js';
import { FREUDE_VERFALL_PRO_STUNDE } from '../src/cat/tamagotchi.js';
import { DECAY_PER_HOUR } from '../src/cat/needs.js';

/*
  Die Zufriedenheit sank nie. Der Abbau-Intervall hing an hunger/thirst, und
  der Hunger ändert sich jede Minute – also wurde der Intervall jede Minute
  abgebaut und neu gestartet, bevor er je auslöste.

  Gemessen wird mit der Testuhr über eine ganze Stunde, denn nur so zeigt sich,
  dass der Intervall trotz wechselnden Hungers tatsächlich auslöst.
*/
const START = '2026-10-06T10:00:00'; // tagsüber: kein Schlaf, keine Nachterholung

test('Zufriedenheit fällt tagsüber ohne Not um den Stundenwert', async ({ page }) => {
  await page.clock.install({ time: new Date(START) });
  await grundaufbau(page);
  await page.addInitScript((startzeit) => {
    try {
      const stand = {
        cat_hunger: 80, cat_thirst: 80, cat_freude: 70,
        cat_coinCount: 500,
        cat_lastSeen: startzeit, cat_fwDone: '1',
      };
      for (const [k, v] of Object.entries(stand)) localStorage.setItem(k, String(v));
    } catch { /* gesperrt */ }
  }, new Date(START).getTime());
  await page.goto('/');
  await page.waitForSelector('.status-indicator .online');

  for (let i = 0; i < 60; i += 1) await page.clock.runFor(60_000);

  const lesen = (k) => page.evaluate((key) => Number(localStorage.getItem(key)), k);
  // Gegenprobe: der Hunger fiel, der Intervall lief also wirklich
  expect(await lesen('cat_hunger')).toBeCloseTo(80 - DECAY_PER_HOUR, 0);
  const freude = await lesen('cat_freude');
  expect(freude).toBeGreaterThan(70 - FREUDE_VERFALL_PRO_STUNDE - 1);
  expect(freude).toBeLessThan(70 - FREUDE_VERFALL_PRO_STUNDE + 1);
});
