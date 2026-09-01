/*
  Bedürfnisse der Katze: Hunger und Durst.

  Vorher waren beide Werte reine Deko – sie fielen auf 0 und kein Codepfad las
  sie je aus. Hier steckt jetzt die Wirkung: der Zustand der Katze bestimmt,
  wie viele Münzen sie einbringt und wie sie sich verhält.

  Reine Funktionen, damit das ohne Browser prüfbar bleibt.
*/

export const NEED_MAX = 100;
export const NEED_MIN = 0;

/* Rund acht Stunden von satt auf leer – eine Schicht hält die Katze also durch. */
export const DECAY_PER_HOUR = 12;

/* Nach längerer Abwesenheit soll sie nicht völlig ausgehungert begrüßen. */
export const MAX_OFFLINE_DECAY = 25;

export const clampNeed = (value) =>
  Math.max(NEED_MIN, Math.min(NEED_MAX, Number.isFinite(value) ? value : NEED_MAX));

/*
  Zustandsstufen. `factor` ist der Multiplikator auf den Münzgewinn:
  eine gut versorgte Katze bringt mehr, eine schwache gar nichts.
*/
export const CONDITIONS = [
  { key: 'munter',  min: 70, factor: 1.5, emoji: '😸', label: 'munter',   hint: null },
  { key: 'normal',  min: 40, factor: 1,   emoji: '😺', label: 'zufrieden', hint: null },
  { key: 'traege',  min: 15, factor: 0.5, emoji: '😿', label: 'träge',     hint: 'Die Katze wird träge – Zeit für Futter.' },
  { key: 'schwach', min: 0,  factor: 0,   emoji: '🙀', label: 'schwach',   hint: 'Die Katze ist erschöpft und sammelt nichts mehr.' },
];

export const conditionValue = (hunger, thirst) =>
  Math.min(clampNeed(hunger), clampNeed(thirst));

export const conditionOf = (hunger, thirst) => {
  const value = conditionValue(hunger, thirst);
  return CONDITIONS.find((c) => value >= c.min) ?? CONDITIONS[CONDITIONS.length - 1];
};

/* Münzgewinn nach Zustand – nie negativ, immer ganzzahlig. */
export const coinsFor = (base, hunger, thirst) => {
  const { factor } = conditionOf(hunger, thirst);
  return Math.max(0, Math.round(base * factor));
};

/* Verfall über eine Zeitspanne, optional gedeckelt (für Abwesenheit). */
export const decayOver = (value, elapsedMs, { cap = Infinity } = {}) => {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return clampNeed(value);
  const loss = Math.min(cap, (elapsedMs / 3_600_000) * DECAY_PER_HOUR);
  return clampNeed(clampNeed(value) - loss);
};

/*
  Zustand nach einer Pause wiederherstellen (Tab zu, Gerät aus).

  Die Faktoren kommen aus der gekauften Ausstattung (Futterautomat,
  Trinkbrunnen). Sie müssen auch hier greifen: über Nacht ist der Verfall
  am grössten, das ist genau der Fall, für den man das Ding kauft.
*/
export const catchUp = (
  { hunger, thirst, lastSeen, hungerFaktor = 1, durstFaktor = 1 },
  now = Date.now(),
) => {
  const elapsed = Number.isFinite(lastSeen) ? now - lastSeen : 0;
  const opts = { cap: MAX_OFFLINE_DECAY };
  return {
    hunger: decayOver(hunger, elapsed * hungerFaktor, opts),
    thirst: decayOver(thirst, elapsed * durstFaktor, opts),
  };
};

export const feed = (value, amount) => clampNeed(clampNeed(value) + Math.max(0, amount));
