/*
  Wachstum und Bindung.

  Im Original bestimmt die Pflegequalität, zu welcher Gestalt das Tier
  heranwächst – und schlechte Pflege verkürzt sein Leben. Hier zählt nur, was
  gut lief: Phasen steigen mit gepflegten Tagen, die Freundschaft wächst und
  fällt nie. Kein Rückschritt, keine Strafe. Wer die Katze eine Woche
  vergisst, verliert nichts – es geht nur langsamer voran.

  Reine Funktionen, damit die Regeln ohne Browser prüfbar sind.
*/

export const PHASEN = [
  { key: 'kitten',       ab: 0,  name: 'Kitten',       groesse: 0.74 },
  { key: 'jung',         ab: 3,  name: 'Jungkatze',    groesse: 0.87 },
  { key: 'ausgewachsen', ab: 10, name: 'ausgewachsen', groesse: 1 },
];

export const phase = (gepflegteTage = 0) => {
  const t = Number.isFinite(gepflegteTage) ? Math.max(0, gepflegteTage) : 0;
  return [...PHASEN].reverse().find((p) => t >= p.ab) ?? PHASEN[0];
};

/* Wie viele Tage fehlen bis zur nächsten Phase? null heisst: schon ganz oben. */
export const bisNaechstePhase = (gepflegteTage = 0) => {
  const naechste = PHASEN.find((p) => p.ab > gepflegteTage);
  return naechste ? { phase: naechste, fehlt: naechste.ab - gepflegteTage } : null;
};

// ── Freundschaft ─────────────────────────────────────────────────────────────

export const FREUNDSCHAFT_MAX = 100;
export const FREUNDSCHAFT_FUETTERN = 2;
export const FREUNDSCHAFT_STREICHELN = 1;
export const FREUNDSCHAFT_SPIELEN = 1;
export const FREUNDSCHAFT_TAG = 5;

/* Wächst nur – deshalb kein Verfall und keine untere Grenze nötig. */
export const mehrFreundschaft = (wert, plus) => {
  const w = Number.isFinite(wert) ? wert : 0;
  const p = Number.isFinite(plus) && plus > 0 ? plus : 0;
  return Math.min(FREUNDSCHAFT_MAX, Math.max(0, w) + p);
};

/* Fünf Herzen, gefüllte gerundet nach oben – schon ein Punkt zeigt eines. */
export const herzen = (freundschaft = 0) => {
  const w = Math.max(0, Math.min(FREUNDSCHAFT_MAX, Number.isFinite(freundschaft) ? freundschaft : 0));
  return Math.ceil(w / (FREUNDSCHAFT_MAX / 5));
};

// ── Tageszählung ─────────────────────────────────────────────────────────────

/* Ortsdatum als Zeichenkette, damit der Vergleich ohne Zeitzonen auskommt. */
export const tagesSchluessel = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/*
  Ein Tag zählt, wenn die Katze an diesem Tag in Ordnung war – also weder
  schwach noch krank. Höchstens einmal je Kalendertag.
*/
export const zaehleTag = ({ gepflegteTage = 0, letzterTag = null, freundschaft = 0 }, zustandKey, jetzt = new Date()) => {
  const heute = tagesSchluessel(jetzt);
  const inOrdnung = zustandKey !== 'schwach' && zustandKey !== 'krank';
  if (!inOrdnung || letzterTag === heute) {
    return { gepflegteTage, letzterTag, freundschaft, neuerTag: false };
  }
  return {
    gepflegteTage: gepflegteTage + 1,
    letzterTag: heute,
    freundschaft: mehrFreundschaft(freundschaft, FREUNDSCHAFT_TAG),
    neuerTag: true,
  };
};
