/*
  Mäuseloch (Etappe 5): In der Fussleiste sind vier Löcher. Eine
  Spielzeugmaus lugt kurz heraus – wer sie antippt, bevor sie verschwindet,
  schickt die Katze hinterher. Je länger das Spiel, desto flinker die Maus.

  Bringt Laune und Freundschaft, keine Münzen: Münzen gibt es beim
  Leckerli fangen, dort mit Tagesgrenze.
*/
export const MAUS = {
  dauer: 30_000,
  vorlauf: 800,          // kurz durchatmen, bevor die erste kommt
  zeigtMax: 1500,        // so lange zeigt sich die erste Maus
  zeigtMin: 650,         // schneller wird es nicht
  pauseMin: 250,
  pauseMax: 900,
  launeJeTreffer: 2,
  launeMax: 20,
  // Löcher in der Fussleiste, frei von Möbeln (Szene 1024 × 768)
  loecher: [{ x: 150 }, { x: 360 }, { x: 700 }, { x: 900 }],
  leisteY: 462,          // Unterkante der Wand
};

/* Ablauf einer Runde: welches Loch, ab wann, wie lange sichtbar. */
export function mausPlan(zufall = Math.random) {
  const plan = [];
  let t = MAUS.vorlauf;
  let letztes = -1;
  for (let i = 0; ; i += 1) {
    const fortschritt = Math.min(1, t / MAUS.dauer);
    const zeigt = Math.round(MAUS.zeigtMax - (MAUS.zeigtMax - MAUS.zeigtMin) * fortschritt);
    if (t + zeigt > MAUS.dauer) break;
    // nie dasselbe Loch zweimal hintereinander
    let loch = Math.floor(zufall() * (MAUS.loecher.length - 1));
    if (loch >= letztes && letztes >= 0) loch += 1;
    loch = Math.min(loch, MAUS.loecher.length - 1);
    if (loch === letztes) loch = (loch + 1) % MAUS.loecher.length;
    plan.push({ id: i, loch, ab: t, zeigt });
    letztes = loch;
    t += zeigt + Math.round(MAUS.pauseMin + (MAUS.pauseMax - MAUS.pauseMin) * zufall());
  }
  return plan;
}

export const launeFuer = (treffer) => Math.min(MAUS.launeMax, Math.max(0, treffer) * MAUS.launeJeTreffer);

/* Wohin die Katze springt: auf den Boden direkt vor dem Loch. */
export const vorDemLoch = (loch) => ({ x: MAUS.loecher[loch].x, y: 580 });
