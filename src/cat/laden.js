/*
  Katzenladen.

  Bis hierher hatten Münzen genau zwei Verwendungen: füttern (1 bis 5) und der
  Einsatz im Hütchenspiel (5). Die höchste Freischaltung lag bei 120 – bei
  einem Stand von rund 1410 gab es seit Monaten nichts mehr zu erreichen.

  Der Laden ist die dauerhafte Verwendung: Gekauftes bleibt, das Anlegen ist
  frei, und die Preise reichen weit über den heutigen Stand hinaus.

  Reine Funktionen, damit die Regeln ohne Browser prüfbar bleiben.
*/

/* Fellfarben verweisen auf VARIANTS in CatVariant.jsx (Reihenfolge = Index). */
export const FELLE = [
  { id: 'fell-blau',   variante: 2, name: 'Blau',    preis: 150 },
  { id: 'fell-rosa',   variante: 3, name: 'Rosa',    preis: 150 },
  { id: 'fell-ginger', variante: 4, name: 'Ginger',  preis: 300 },
  { id: 'fell-tuxedo', variante: 6, name: 'Tuxedo',  preis: 600 },
  { id: 'fell-siam',   variante: 7, name: 'Siam',    preis: 900 },
  { id: 'fell-calico', variante: 8, name: 'Calico',  preis: 1400 },
  { id: 'fell-snow',   variante: 9, name: 'Schnee',  preis: 2000 },
  { id: 'fell-mint',   variante: 10, name: 'Mint',   preis: 2600 },
  { id: 'fell-gold',   variante: 11, name: 'Gold',   preis: 3600 },
  { id: 'fell-galaxy', variante: 12, name: 'Galaxie', preis: 5000 },
];

export const ZUBEHOER = [
  { id: 'halsband',       name: 'Halsband',       preis: 250,  emoji: '⭕' },
  { id: 'brille',         name: 'Brille',         preis: 500,  emoji: '🕶️' },
  { id: 'kopfhoerer',     name: 'Kopfhörer',      preis: 800,  emoji: '🎧' },
  { id: 'schal',          name: 'Schal',          preis: 1100, emoji: '🧣' },
  { id: 'hut',            name: 'Zylinder',       preis: 1800, emoji: '🎩' },
  { id: 'heiligenschein', name: 'Heiligenschein', preis: 2200, emoji: '😇' },
  { id: 'schleife',       name: 'Schleife',       preis: 3000, emoji: '🎀' },
  { id: 'fluegel',        name: 'Flügel',         preis: 4200, emoji: '🦋' },
  { id: 'umhang',         name: 'Umhang',         preis: 5500, emoji: '🦸' },
];

/*
  Ausstattung: der Teil des Ladens, der nicht nur hübsch ist.

  Fell und Zubehör verändern das Aussehen – schön, aber folgenlos. Diese
  Artikel greifen in die Regeln ein: sie bremsen den Verfall, machen den
  Schlaf erholsam oder erhöhen den Münzfund. Sie werden nicht angelegt,
  sondern stehen nach dem Kauf einfach im Raum und wirken.
*/
export const AUSSTATTUNG = [
  {
    id: 'futterautomat', name: 'Futterautomat', preis: 700, emoji: '🍚',
    wirkung: 'Der Hunger fällt ein Viertel langsamer.',
  },
  {
    id: 'trinkbrunnen', name: 'Trinkbrunnen', preis: 700, emoji: '⛲',
    wirkung: 'Der Durst fällt ein Viertel langsamer.',
  },
  {
    id: 'kratzbaum', name: 'Kratzbaum', preis: 1200, emoji: '🪵',
    wirkung: 'Die Zufriedenheit fällt fast ein Drittel langsamer.',
  },
  {
    id: 'kuschelhoehle', name: 'Kuschelhöhle', preis: 2000, emoji: '🛏️',
    wirkung: 'Nachts erholt sie sich, statt weiter abzubauen.',
  },
  {
    id: 'glueckspfote', name: 'Glückspfote', preis: 2600, emoji: '🍀',
    wirkung: 'Jeder Münzfund bringt eine Münze mehr.',
  },
];

export const ALLE = [...FELLE, ...ZUBEHOER, ...AUSSTATTUNG];

export const artikel = (id) => ALLE.find((a) => a.id === id) ?? null;

export const istFell = (id) => FELLE.some((f) => f.id === id);

export const istAusstattung = (id) => AUSSTATTUNG.some((a) => a.id === id);

/* Was die gekaufte Ausstattung an den Regeln ändert. Faktor 1 heisst: nichts. */
export const effekte = (besitz) => {
  const b = putzeBesitz(besitz);
  return {
    hungerFaktor: b.includes('futterautomat') ? 0.75 : 1,
    durstFaktor: b.includes('trinkbrunnen') ? 0.75 : 1,
    freudeFaktor: b.includes('kratzbaum') ? 0.7 : 1,
    schlafErholung: b.includes('kuschelhoehle'),
    muenzBonus: b.includes('glueckspfote') ? 1 : 0,
  };
};

/* Besitz ist eine Liste von Kennungen; unbekannte werden verworfen. */
export const putzeBesitz = (roh) =>
  Array.isArray(roh) ? [...new Set(roh.filter((id) => typeof id === 'string' && artikel(id)))] : [];

/*
  Kaufen. Gibt den neuen Zustand zurück plus einen Grund, wenn es nicht ging –
  der Aufrufer entscheidet, was er meldet.
*/
export const kaufen = (zustand, id) => {
  const a = artikel(id);
  if (!a) return { ...zustand, ok: false, grund: 'unbekannt' };
  if (zustand.besitz.includes(id)) return { ...zustand, ok: false, grund: 'schon gekauft' };
  if (zustand.muenzen < a.preis) return { ...zustand, ok: false, grund: 'zu teuer' };
  return {
    muenzen: zustand.muenzen - a.preis,
    besitz: [...zustand.besitz, id],
    ok: true,
  };
};

/* Anlegen und Ablegen kosten nichts – nur Gekauftes lässt sich anlegen. */
export const anlegen = (besitz, angelegt, id) => {
  // Einen Kratzbaum zieht man nicht an: Ausstattung wirkt ab Kauf von selbst.
  if (istAusstattung(id)) return angelegt;
  if (!besitz.includes(id)) return angelegt;
  if (istFell(id)) return { ...angelegt, fell: id };             // nur ein Fell zur Zeit
  return { ...angelegt, [id]: true };
};

export const ablegen = (angelegt, id) => {
  if (istFell(id)) {
    const { fell, ...rest } = angelegt;
    return fell === id ? rest : angelegt;
  }
  const { [id]: _weg, ...rest } = angelegt;
  return rest;
};

export const istAngelegt = (angelegt, id) => {
  if (istAusstattung(id)) return true;   // gekauft heisst hier: in Betrieb
  return istFell(id) ? angelegt.fell === id : Boolean(angelegt[id]);
};

/* Welche Fellvariante soll gezeigt werden? null heisst: die übliche Rotation. */
export const angelegtesFell = (angelegt) => {
  const f = FELLE.find((x) => x.id === angelegt?.fell);
  return f ? f.variante : null;
};

/* Fortschritt für die Anzeige: wie viel vom Laden ist schon erreicht? */
export const fortschritt = (besitz) => ({
  gekauft: besitz.length,
  gesamt: ALLE.length,
  ausgegeben: besitz.reduce((s, id) => s + (artikel(id)?.preis ?? 0), 0),
});
