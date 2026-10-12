/*
  Spiele (2.10.0): Seifenblasen, Nachmachen, Apportieren.
  Reine Regeln; die Spiele selbst stehen in Spiel*.jsx.
*/

/* Auf dem Boden bleibt sie: Ziele werden auf die freie Bodenfläche geklemmt. */
export const amBoden = (p) => ({ x: Math.max(180, Math.min(960, p.x)), y: Math.max(580, Math.min(675, p.y)) });

// ── Seifenblasen: antippen, sie platzen, die Katze springt hin ──────────
export const BLASEN = {
  dauer: 30_000,
  abstand: 850,          // so oft steigt eine neue Blase auf
  steigen: [4_200, 6_800],
  start: 700,            // Blasen steigen vom Boden …
  ende: 90,              // … bis unter die Decke
  laune: 1,
  launeMax: 14,
};
export function blaseNeu(id, jetzt, zufall = Math.random) {
  const [min, max] = BLASEN.steigen;
  return {
    id,
    x: Math.round(200 + zufall() * 720),
    r: Math.round(18 + zufall() * 18),
    dauer: Math.round(min + zufall() * (max - min)),
    start: jetzt,
  };
}
/* Wo die Blase gerade ist – gleichmässig aufsteigend. */
export const blaseHoehe = (b, jetzt) => {
  const anteil = Math.max(0, Math.min(1, (jetzt - b.start) / b.dauer));
  return Math.round(BLASEN.start - anteil * (BLASEN.start - BLASEN.ende));
};
export const blaseWeg = (b, jetzt) => jetzt - b.start >= b.dauer;
export const blasenLaune = (n) => Math.min(BLASEN.launeMax, Math.max(0, n) * BLASEN.laune);

// ── Nachmachen: sie tippt Kissen an, man macht es nach ─────────────────
export const NACHMACHEN = { kissen: 4, runden: 8, lohnJe: 2, zeigen: 750 };
export const KISSEN = [
  { x: 270, farbe: '#ef4444', hell: '#fecaca' },
  { x: 430, farbe: '#3b82f6', hell: '#bfdbfe' },
  { x: 590, farbe: '#22c55e', hell: '#bbf7d0' },
  { x: 750, farbe: '#f59e0b', hell: '#fde68a' },
];
const kissenWurf = (zufall) => Math.min(NACHMACHEN.kissen - 1, Math.floor(zufall() * NACHMACHEN.kissen));

export const nachmachenStart = (zufall = Math.random) => ({ folge: [kissenWurf(zufall)], eingabe: 0, phase: 'zeigen' });
export const naechsteRunde = (s, zufall = Math.random) => ({ folge: [...s.folge, kissenWurf(zufall)], eingabe: 0, phase: 'zeigen' });

/*
  Ein Kissen antippen. Nur in der Phase "nachmachen".
  Danach: 'falsch' (vorbei), 'geschafft' (nächste Runde) oder 'fertig' (alle Runden).
*/
export function nachmachenTipp(s, k) {
  if (s.phase !== 'nachmachen') return s;
  if (s.folge[s.eingabe] !== k) return { ...s, phase: 'falsch' };
  const eingabe = s.eingabe + 1;
  if (eingabe < s.folge.length) return { ...s, eingabe };
  return { ...s, eingabe, phase: s.folge.length >= NACHMACHEN.runden ? 'fertig' : 'geschafft' };
}
/* Wie viele Runden ganz richtig waren. */
export const nachmachenRunden = (s) => (s.phase === 'geschafft' || s.phase === 'fertig' ? s.folge.length : s.folge.length - 1);
export const nachmachenLohn = (runden) => Math.min(NACHMACHEN.runden, Math.max(0, runden)) * NACHMACHEN.lohnJe;

// ── Apportieren: Wollknäuel werfen, sie bringt es zurück ───────────────
export const WOLLE = {
  dauer: 40_000,
  heim: { x: 512, y: 690 },   // hier liegt das Knäuel und hier legt sie es ab
  flug: 600,
  laune: 3,
  launeMax: 15,
  nahGenug: 40,
};
export const wurfZiel = (p) => amBoden(p);
export const angekommen = (katze, ziel) => Math.hypot(katze.x - ziel.x, katze.y - ziel.y) <= WOLLE.nahGenug;
export const wolleLaune = (n) => Math.min(WOLLE.launeMax, Math.max(0, n) * WOLLE.laune);
