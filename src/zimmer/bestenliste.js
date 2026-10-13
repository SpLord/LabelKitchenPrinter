/*
  Bestenlisten (2.14.0) für Gurkenhüpfer und Leckerli-Drei: die fünf besten
  Ergebnisse dieses Geräts, mit Namen. Das Küchentablet teilen sich mehrere –
  der Name sagt, wer den Rekord hält. Reine Regeln; Speichern: useBestenliste.
*/
export const PLAETZE = 5;
export const NAME_MAX = 14;
export const KEY_NAME = 'zimmer_spielername';
export const keyFuer = (spiel) => `zimmer_rekorde_${spiel}`;

export const namePutzen = (roh) => {
  const n = String(roh ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return n || 'Ich';
};

export function listeLesen(roh) {
  try {
    const d = JSON.parse(roh);
    if (!Array.isArray(d)) return [];
    return d
      .filter((e) => e && Number.isFinite(e.wert) && e.wert > 0)
      .map((e) => ({ id: String(e.id ?? `${e.datum}-${e.wert}`), name: namePutzen(e.name), wert: Math.round(e.wert), datum: Number(e.datum) || 0 }))
      .sort((a, b) => b.wert - a.wert || a.datum - b.datum)
      .slice(0, PLAETZE);
  } catch { return []; }
}

/* Kommt dieser Wert in die Liste? */
export const kommtRein = (liste, wert) => wert > 0 && (liste.length < PLAETZE || wert > liste[liste.length - 1].wert);

/* Eintragen: neue Liste und Platz (1 = Rekord), oder platz null, wenn es nicht reicht. */
export function eintragen(liste, eintrag) {
  if (!kommtRein(liste, eintrag.wert)) return { liste, platz: null };
  const neu = [...liste, eintrag].sort((a, b) => b.wert - a.wert || a.datum - b.datum).slice(0, PLAETZE);
  return { liste: neu, platz: neu.findIndex((e) => e.id === eintrag.id) + 1 };
}

export const umbenennen = (liste, id, name) => liste.map((e) => (e.id === id ? { ...e, name: namePutzen(name) } : e));
export const rekord = (liste) => liste[0]?.wert ?? 0;
