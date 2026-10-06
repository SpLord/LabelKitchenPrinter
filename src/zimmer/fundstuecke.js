import { schichtSchluessel } from '../print/schicht.js';

/*
  Fundstücke (fünftes Herz, Etappe 7): Ab und zu bringt die Katze etwas
  Seltenes mit und legt es ins Zimmer. Antippen nimmt es ins Album.
  Einmal je Schichttag wird gewürfelt; was noch fehlt, kommt bevorzugt.
*/
export const FUNDSTUECKE = [
  { id: 'feder', name: 'Blaue Feder', text: 'Vom Vogel am Fenster.' },
  { id: 'knopf', name: 'Goldknopf', text: 'Von einer Kochjacke, wer weiss wessen.' },
  { id: 'murmel', name: 'Murmel', text: 'Rollte unter dem Herd hervor.' },
  { id: 'korken', name: 'Korken', text: 'Riecht noch nach Rotweinsauce.' },
  { id: 'muschel', name: 'Muschel', text: 'Aus der Miesmuschel-Lieferung.' },
  { id: 'kastanie', name: 'Kastanie', text: 'Glänzt wie frisch poliert.' },
  { id: 'socke', name: 'Einzelne Socke', text: 'Die andere bleibt verschollen.' },
  { id: 'stern', name: 'Glitzerstern', text: 'Vom letzten Weihnachtsessen.' },
];

export const FUND = { chance: 0.5, lohn: 5 };

const IDS = new Set(FUNDSTUECKE.map((f) => f.id));
const leer = () => ({ gewuerfelt: null, gefunden: [], offen: null });

/* Einmal je Schichttag: liegt heute etwas da? */
export function fundPruefen(stand, { frei }, jetzt = new Date(), zufall = Math.random) {
  const s = stand ?? leer();
  if (!frei) return s;
  const heute = schichtSchluessel(jetzt);
  if (s.gewuerfelt === heute || s.offen) return s;
  if (zufall() >= FUND.chance) return { ...s, gewuerfelt: heute };
  const fehlt = FUNDSTUECKE.filter((f) => !s.gefunden.includes(f.id));
  const auswahl = fehlt.length ? fehlt : FUNDSTUECKE;
  const fund = auswahl[Math.min(auswahl.length - 1, Math.floor(zufall() * auswahl.length))];
  return { ...s, gewuerfelt: heute, offen: fund.id };
}

export function einsammeln(stand) {
  if (!stand?.offen) return { stand, lohn: 0, neu: false };
  const neu = !stand.gefunden.includes(stand.offen);
  return {
    stand: { ...stand, offen: null, gefunden: neu ? [...stand.gefunden, stand.offen] : stand.gefunden },
    lohn: FUND.lohn,
    neu,
    id: stand.offen,
  };
}

export function fundLesen(roh) {
  let d;
  try { d = JSON.parse(roh); } catch { return leer(); }
  if (!d || typeof d !== 'object') return leer();
  const gefunden = [...new Set((Array.isArray(d.gefunden) ? d.gefunden : []).filter((id) => IDS.has(id)))];
  return {
    gewuerfelt: typeof d.gewuerfelt === 'string' ? d.gewuerfelt : null,
    gefunden,
    offen: IDS.has(d.offen) ? d.offen : null,
  };
}
