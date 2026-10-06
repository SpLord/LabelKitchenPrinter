/*
  Regeln der Minispiele im Katzenzimmer – reine Funktionen, ohne Browser
  prüfbar. Darstellung und Takt: SpielFederangel.jsx, SpielLeckerli.jsx.

  Szene 1024 × 768 wie überall im Zimmer.
*/

// ── Leckerli fangen ──────────────────────────────────────────────────────────

export const LECKERLI = {
  dauer: 30_000,          // eine Runde
  anzahl: 18,             // so viele fallen insgesamt
  start: -40,             // Höhe, auf der sie erscheinen
  napfHoehe: 620,         // hier wird gefangen
  napfBreite: 110,        // Fangbreite (halb = 55 je Seite)
  links: 90,
  rechts: 934,
  maxMuenzen: 10,         // mehr bringt eine Runde nie
  pause: 60 * 60_000,     // eine Runde pro Stunde
};

/*
  Fallplan einer Runde: wann welches Leckerli wo erscheint und wie lange es
  bis zum Napf braucht. Der Zufall kommt von aussen, damit Tests ihn
  festnageln können. Später in der Runde fallen sie schneller.
*/
export function fallplan(zufall = Math.random, regeln = LECKERLI) {
  const plan = [];
  const abstand = (regeln.dauer - 3000) / regeln.anzahl;
  for (let i = 0; i < regeln.anzahl; i += 1) {
    const fortschritt = i / Math.max(1, regeln.anzahl - 1);
    const fallzeit = Math.round(3200 - fortschritt * 1400 + zufall() * 400);   // 3,2 s → 1,8 s
    plan.push({
      id: i,
      x: Math.round(regeln.links + zufall() * (regeln.rechts - regeln.links)),
      ab: Math.round(i * abstand + zufall() * abstand * 0.4),
      fallzeit,
      art: zufall() < 0.5 ? 'fisch' : 'keks',
    });
  }
  return plan;
}

/* Gefangen, wenn der Napf beim Aufkommen darunter steht. */
export const gefangen = (leckerliX, napfX, regeln = LECKERLI) =>
  Math.abs(leckerliX - napfX) <= regeln.napfBreite / 2;

export const muenzenFuerRunde = (faenge, regeln = LECKERLI) =>
  Math.max(0, Math.min(regeln.maxMuenzen, Math.floor(faenge)));

/* Darf jetzt eine Runde starten? Liefert die Wartezeit in ms (0 = ja). */
export const wartezeit = (zuletzt, jetzt = Date.now(), regeln = LECKERLI) => {
  const z = Number(zuletzt);
  if (!Number.isFinite(z) || z <= 0) return 0;
  return Math.max(0, z + regeln.pause - jetzt);
};

// ── Federangel ───────────────────────────────────────────────────────────────

export const FEDER = {
  dauer: 45_000,
  reichweite: 70,         // so nah muss die Katze an der Feder sein
  tiefMin: 470,           // nur wenn die Feder tief genug hängt (Boden beginnt hier)
  haltezeit: 700,         // so lange in Reichweite = gefangen
  laune: 4,               // je Fang
};

/* Kann die Katze die Feder gerade erreichen? */
export const inReichweite = (katze, feder, regeln = FEDER) =>
  feder.y >= regeln.tiefMin
  && Math.hypot(feder.x - katze.x, (feder.y - katze.y) * 0.6) <= regeln.reichweite;

/* Wohin die Katze läuft: unter die Feder, aber auf dem Boden. */
export const zielUnterFeder = (feder) => ({
  x: Math.max(160, Math.min(980, Math.round(feder.x))),
  y: Math.max(570, Math.min(680, Math.round(feder.y + 40))),
});
