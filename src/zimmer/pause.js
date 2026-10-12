/*
  Wie lange ein Münzspiel nach einer Runde gesperrt ist – für alle gleich.

  Bis 2.11.0 war es eine Stunde. Das war zu streng: in einer Pause kam man
  kaum zweimal zum Spielen (Wunsch 2026-10-12: "wesentlich runtersetzen").
*/
export const MUENZ_PAUSE = 5 * 60_000;
export const PAUSE_TEXT = `alle ${MUENZ_PAUSE / 60_000} Minuten`;

/* Wartezeit in ms bis zur nächsten Runde (0 = sofort). Kaputter Speicher sperrt nie. */
export const restPause = (zuletzt, jetzt = Date.now(), pause = MUENZ_PAUSE) => {
  const z = Number(zuletzt);
  if (!Number.isFinite(z) || z <= 0) return 0;
  return Math.max(0, z + pause - jetzt);
};

/* "wieder in 4 min" bzw. "wieder in 40 s" – unter einer Minute in Sekunden. */
export const pauseAnzeige = (ms) => (ms >= 60_000 ? `${Math.ceil(ms / 60_000)} min` : `${Math.ceil(ms / 1000)} s`);
