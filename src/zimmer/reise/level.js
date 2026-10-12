import { LECKERLI, restDosen, restKisten, restPfuetzen } from './brett.js';

/*
  Die dreissig Level der Leckerli-Reise (2.13.0), in drei Welten.

  Vorlage: 7 Zeilen à 7 Zeichen –  .  Feld   p/P Pfütze (1/2)   k/K Kiste (1/2)   d Dose
  Ziele:   punkte n · sammeln art n · pfuetzen (alle weg) · kisten (alle weg) · dosen (alle runter)
  sterne:  Punkte für den zweiten und dritten Stern (der erste = Ziele geschafft).
           Übrige Züge zählen am Ende als Bonus (ZUG_BONUS je Zug).

  Jede Welt führt etwas Neues ein und mischt es dann mit dem Bekannten:
  Küche – Spezial-Leckerli und Pfützen, Garten – Kisten und Dosen,
  Dachboden – alles zusammen, weniger Züge, sechs Sorten.
*/

export const ZUG_BONUS = 60;
export const WELTEN = [
  { id: 'kueche', name: 'Küche', farbe: '#fde68a' },
  { id: 'garten', name: 'Garten', farbe: '#bbf7d0' },
  { id: 'dachboden', name: 'Dachboden', farbe: '#ddd6fe' },
];

const L = '.......';
const leer = [L, L, L, L, L, L, L];
const v = (...zeilen) => zeilen;

/* Kurzschreibweise der Ziele */
const punkte = (n) => ({ typ: 'punkte', n });
const sammeln = (art, n) => ({ typ: 'sammeln', art, n });
const PF = { typ: 'pfuetzen' };
const KI = { typ: 'kisten' };
const DO = { typ: 'dosen' };

const ROH = [
  // ── Küche ───────────────────────────────────────────────────────────────
  { zuege: 20, ziele: [punkte(600)], sterne: [1600, 2000], tipp: 'Tausche zwei Nachbarn, sodass drei Gleiche in einer Reihe liegen.' },
  { zuege: 18, ziele: [sammeln('fisch', 15)], sterne: [2000, 2400] },
  { zuege: 18, ziele: [punkte(1200)], sterne: [1800, 2200], tipp: 'Vier in einer Reihe ergeben ein gestreiftes Leckerli – es räumt eine ganze Reihe.' },
  { zuege: 20, ziele: [sammeln('keks', 18), sammeln('maus', 18)], sterne: [2400, 3100] },
  { zuege: 16, ziele: [punkte(1600)], sterne: [2100, 2600], tipp: 'Über Kreuz (L oder T) gibt es ein Paket: es sprengt alles drumherum.' },
  { zuege: 22, ziele: [PF], vorlage: v(L, L, L, 'ppppppp', 'ppppppp', L, L), sterne: [3300, 5800], tipp: 'Milchpfützen verschwinden, wenn über ihnen etwas platzt.' },
  { zuege: 24, ziele: [PF, sammeln('wolle', 15)], vorlage: v(L, L, 'ppppppp', L, 'ppppppp', L, L), sterne: [3200, 4300] },
  { zuege: 24, ziele: [PF], vorlage: v(L, '...p...', '...p...', 'pppPppp', '...p...', '...p...', L), sterne: [2800, 4200], tipp: 'Dicke Pfützen brauchen zwei Treffer.' },
  { zuege: 16, ziele: [sammeln('feder', 24)], sterne: [2800, 3900], tipp: 'Fünf in einer Reihe: ein Regenbogen-Knäuel. Mit einem Leckerli getauscht räumt es alle dieser Sorte.' },
  { zuege: 28, ziele: [PF, punkte(2500)], vorlage: v(L, L, L, 'ppppppp', 'ppPPPpp', 'ppppppp', L), sterne: [3900, 5000] },
  // ── Garten ──────────────────────────────────────────────────────────────
  { zuege: 20, ziele: [KI], vorlage: v(L, L, L, 'kkkkkkk', L, L, L), sterne: [1700, 2400], tipp: 'Kisten zerbrechen, wenn direkt daneben etwas platzt.' },
  { zuege: 22, ziele: [KI], vorlage: v(L, L, '..KKK..', '..KKK..', L, L, L), sterne: [2100, 3000], tipp: 'Dunkle Kisten halten zwei Stösse aus.' },
  { zuege: 20, ziele: [KI, sammeln('fisch', 18)], vorlage: v(L, 'k.....k', 'k.....k', L, 'k.....k', 'k.....k', L), sterne: [2300, 3200] },
  { zuege: 20, ziele: [DO], vorlage: v(L, L, '...d...', L, L, L, L), sterne: [2100, 2900], tipp: 'Die Fischdose muss ganz nach unten – räume darunter frei.' },
  { zuege: 30, ziele: [DO, KI], vorlage: v(L, L, '..d.d..', 'kk...kk', L, L, L), sterne: [2900, 3500] },
  { zuege: 24, ziele: [PF, KI], vorlage: v(L, L, '.kkkkk.', '.kpppk.', '.kpppk.', '.kkkkk.', L), sterne: [2600, 3600] },
  { zuege: 32, ziele: [DO], vorlage: v(L, L, '.d.d.d.', L, L, L, L), sterne: [4100, 4900] },
  { zuege: 24, arten: 6, ziele: [punkte(2000)], sterne: [2300, 2700], tipp: 'Jetzt gibt es sechs Sorten – Reihen werden seltener.' },
  { zuege: 28, ziele: [KI, PF], vorlage: v(L, L, 'kkkkkkk', L, 'ppppppp', 'ppppppp', L), sterne: [3700, 4500] },
  { zuege: 30, ziele: [DO, KI, PF], vorlage: v(L, '..d.d..', '.KK.KK.', L, 'ppppppp', 'ppppppp', L), sterne: [4900, 6300] },
  // ── Dachboden ───────────────────────────────────────────────────────────
  { zuege: 26, ziele: [PF], vorlage: v(L, L, L, 'PPPPPPP', 'PPPPPPP', 'ppppppp', L), sterne: [4200, 5000] },
  { zuege: 20, ziele: [KI], vorlage: v('.K...K.', '.K...K.', '.K...K.', '.K...K.', L, L, L), sterne: [2300, 3000] },
  { zuege: 18, ziele: [sammeln('fisch', 15), sammeln('keks', 15), sammeln('maus', 15)], sterne: [2100, 2700] },
  { zuege: 32, ziele: [DO, PF], vorlage: v(L, L, '.d.d.d.', L, 'ppppppp', 'ppppppp', L), sterne: [4300, 5800] },
  { zuege: 25, arten: 6, ziele: [KI, PF], vorlage: v(L, 'k.k.k.k', L, 'ppppppp', L, 'ppppppp', L), sterne: [2600, 3000] },
  { zuege: 26, ziele: [PF, KI], vorlage: v(L, '.KKKKK.', '.KPPPK.', '.KPPPK.', '.KPPPK.', '.KKKKK.', L), sterne: [3700, 4600] },
  { zuege: 32, ziele: [DO], vorlage: v(L, L, '.d.d.d.', 'kkkkkkk', L, L, L), sterne: [3600, 6600] },
  { zuege: 28, arten: 6, ziele: [punkte(3200)], sterne: [3400, 3800] },
  { zuege: 34, ziele: [DO, KI, PF], vorlage: v(L, '..d.d..', 'K.K.K.K', L, 'ppppppp', 'PPPPPPP', L), sterne: [5100, 9800] },
  { zuege: 38, ziele: [DO, KI, PF], vorlage: v(L, L, '..d.d..', 'KK...KK', 'ppppppp', 'PPPPPPP', 'ppppppp'), sterne: [4900, 5400], tipp: 'Das Finale – zeig, was du gelernt hast!' },
];

export const LEVEL = ROH.map((l, k) => ({
  nr: k + 1,
  welt: WELTEN[Math.floor(k / 10)].id,
  vorlage: leer,
  tipp: null,
  ...l,
  arten: LECKERLI.slice(0, l.arten ?? 5),
}));

export const levelNr = (nr) => LEVEL[nr - 1] ?? null;

// ── Ziele während des Spiels ───────────────────────────────────────────────
/* Wie viele Kisten, Pfützen, Dosen zu Beginn da sind – das "soll". */
export const anfang = (s) => ({ kisten: restKisten(s), pfuetzen: restPfuetzen(s), dosen: restDosen(s) });

/*
  Stand jedes Ziels: { ziel, ist, soll, fertig }.
  stand = { punkte, gesammelt } (laufend), s = aktuelles Brett, a = anfang().
*/
export function zielStand(level, stand, s, a) {
  return level.ziele.map((z) => {
    let ist; let soll;
    if (z.typ === 'punkte') { ist = stand.punkte; soll = z.n; }
    if (z.typ === 'sammeln') { ist = stand.gesammelt[z.art] ?? 0; soll = z.n; }
    if (z.typ === 'kisten') { soll = a.kisten; ist = a.kisten - restKisten(s); }
    if (z.typ === 'pfuetzen') { soll = a.pfuetzen; ist = a.pfuetzen - restPfuetzen(s); }
    if (z.typ === 'dosen') { soll = a.dosen; ist = a.dosen - restDosen(s); }
    return { ziel: z, ist: Math.min(ist, soll), soll, fertig: ist >= soll };
  });
}
export const geschafft = (staende) => staende.every((z) => z.fertig);

/* Sterne am Ende: 0 = nicht geschafft, sonst 1–3 nach Punkten. */
export function sterne(level, endpunkte, ok) {
  if (!ok) return 0;
  return 1 + (endpunkte >= level.sterne[0] ? 1 : 0) + (endpunkte >= level.sterne[1] ? 1 : 0);
}

// ── Fortschritt (Speicher) und Münzen ──────────────────────────────────────
export const KEY_REISE = 'zimmer_reise';
export const leererFortschritt = () => ({ sterne: {}, rekord: {} });

export function fortschrittLesen(roh) {
  try {
    const d = JSON.parse(roh);
    if (!d || typeof d !== 'object') return leererFortschritt();
    const putz = (o, max) => Object.fromEntries(Object.entries(o ?? {})
      .filter(([k, x]) => levelNr(Number(k)) && Number.isFinite(x) && x >= 0)
      .map(([k, x]) => [k, Math.min(max, Math.round(x))]));
    return { sterne: putz(d.sterne, 3), rekord: putz(d.rekord, 1e7) };
  } catch { return leererFortschritt(); }
}

export const freigeschaltet = (f, nr) => nr === 1 || (f.sterne[nr - 1] ?? 0) > 0;
export const gesamtSterne = (f) => Object.values(f.sterne).reduce((a, b) => a + b, 0);
/* Das nächste noch nicht geschaffte Level (für "weiter"). */
export const naechstesLevel = (f) => LEVEL.find((l) => !(f.sterne[l.nr] > 0))?.nr ?? LEVEL.length;

/*
  Münzen nur fürs erste Schaffen und für neue Sterne – so lässt sich ein
  leichtes Level nicht immer wieder abernten, und es braucht keine Pause.
*/
export const LOHN = { erstmals: 5, jeStern: 2 };
export function ergebnisEintragen(f, nr, neueSterne, endpunkte) {
  const alt = f.sterne[nr] ?? 0;
  const lohn = neueSterne === 0 ? 0
    : (alt === 0 ? LOHN.erstmals : 0) + Math.max(0, neueSterne - alt) * LOHN.jeStern;
  return {
    lohn,
    fortschritt: {
      sterne: { ...f.sterne, [nr]: Math.max(alt, neueSterne) },
      // Rekord zählt nur, wenn das Level geschafft ist
      rekord: neueSterne > 0 ? { ...f.rekord, [nr]: Math.max(f.rekord[nr] ?? 0, endpunkte) } : f.rekord,
    },
  };
}
