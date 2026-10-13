/*
  Spielbrett der Leckerli-Reise (2.13.0) – Match-3 mit Spezial-Leckerli
  und Hindernissen. Reine Regeln, kein Browser, Zufall von aussen.

  Zustand: { n, felder, pfuetzen, id }
  - felder[i]: { id, art, spezial?, leben? } oder null (nur zwischendurch)
      art: ein Leckerli (fisch, keks, maus, wolle, feder, milch), 'regen'
      (Regenbogen-Knäuel), 'kiste' oder 'dose'
      spezial: 'reihe' | 'spalte' | 'bombe' (nur bei Leckerli)
  - pfuetzen[i]: 0, 1 oder 2 – Milchpfützen unter dem Feld; jedes Mal,
    wenn dort etwas platzt, wird sie eine Stufe kleiner.

  Spezial-Leckerli entstehen aus besonderen Reihen:
    4 in einer Reihe       → gestreift: räumt seine Zeile (waagrecht gebildet)
                              bzw. Spalte (senkrecht gebildet)
    L oder T (über Kreuz)  → Paket: räumt das 3 × 3 um sich
    5 in einer Reihe       → Regenbogen-Knäuel: mit einem Leckerli getauscht
                              verschwinden alle dieser Sorte
  Kisten zerbrechen, wenn neben ihnen etwas platzt (oder ein Spezial sie
  trifft). Dosen lassen sich nicht zerstören – sie müssen nach unten.

  Index = zeile * n + spalte.
*/

export const LECKERLI = ['fisch', 'keks', 'maus', 'wolle', 'feder', 'milch'];
export const PUNKTE = { leckerli: 10, kiste: 20, pfuetze: 15, dose: 100, spezial: 30 };

const istLeckerli = (f) => Boolean(f) && LECKERLI.includes(f.art);
const beweglich = (f) => Boolean(f) && f.art !== 'kiste';

export const zeile = (s, i) => Math.floor(i / s.n);
export const spalte = (s, i) => i % s.n;
export const nachbarn = (s, a, b) =>
  a !== b && ((zeile(s, a) === zeile(s, b) && Math.abs(a - b) === 1) || (spalte(s, a) === spalte(s, b) && Math.abs(a - b) === s.n));
const umgebung = (s, i) => {
  const z = zeile(s, i); const sp = spalte(s, i);
  return [z > 0 && i - s.n, z < s.n - 1 && i + s.n, sp > 0 && i - 1, sp < s.n - 1 && i + 1].filter((x) => x !== false);
};

const wurf = (arten, zufall) => arten[Math.min(arten.length - 1, Math.floor(zufall() * arten.length))];
const neuesId = (s) => ({ ...s, id: s.id + 1 });

// ── Reihen finden ───────────────────────────────────────────────────────────
/* Alle Läufe aus ≥ 3 gleichen Leckerli: { zellen, richtung: 'w' | 's' }. */
export function laeufe(s) {
  const gefunden = [];
  const pruefen = (indizes, richtung) => {
    let lauf = [];
    const schluss = () => { if (lauf.length >= 3) gefunden.push({ zellen: lauf, richtung }); };
    for (const i of indizes) {
      const f = s.felder[i];
      if (istLeckerli(f) && lauf.length && s.felder[lauf[0]].art === f.art) lauf.push(i);
      else { schluss(); lauf = istLeckerli(f) ? [i] : []; }
    }
    schluss();
  };
  for (let z = 0; z < s.n; z += 1) pruefen(Array.from({ length: s.n }, (_, k) => z * s.n + k), 'w');
  for (let sp = 0; sp < s.n; sp += 1) pruefen(Array.from({ length: s.n }, (_, k) => k * s.n + sp), 's');
  return gefunden;
}

/* Läufe, die sich Zellen teilen, gehören zu einer Gruppe (L- und T-Formen). */
export function gruppen(s) {
  const ls = laeufe(s);
  const gruppe = ls.map((_, k) => k);
  const wurzel = (k) => (gruppe[k] === k ? k : (gruppe[k] = wurzel(gruppe[k])));
  for (let a = 0; a < ls.length; a += 1) {
    for (let b = a + 1; b < ls.length; b += 1) {
      if (ls[a].zellen.some((c) => ls[b].zellen.includes(c))) gruppe[wurzel(a)] = wurzel(b);
    }
  }
  const sammlung = new Map();
  ls.forEach((l, k) => {
    const w = wurzel(k);
    if (!sammlung.has(w)) sammlung.set(w, { zellen: new Set(), laeufe: [] });
    const g = sammlung.get(w);
    l.zellen.forEach((c) => g.zellen.add(c));
    g.laeufe.push(l);
  });
  return [...sammlung.values()].map((g) => ({ zellen: [...g.zellen], laeufe: g.laeufe }));
}

/* Was aus einer Gruppe entsteht: null, oder { spezial, art }. */
export function belohnung(g) {
  const laengste = Math.max(...g.laeufe.map((l) => l.zellen.length));
  if (laengste >= 5) return 'regen';
  const richtungen = new Set(g.laeufe.map((l) => l.richtung));
  if (richtungen.size === 2) return 'bombe';
  if (laengste === 4) return g.laeufe.find((l) => l.zellen.length === 4).richtung === 'w' ? 'reihe' : 'spalte';
  return null;
}

// ── Tauschen ───────────────────────────────────────────────────────────────
export const tausch = (s, a, b) => ({ ...s, felder: s.felder.map((f, i) => (i === a ? s.felder[b] : i === b ? s.felder[a] : f)) });

export function gueltig(s, a, b) {
  if (!nachbarn(s, a, b)) return false;
  const fa = s.felder[a]; const fb = s.felder[b];
  if (!beweglich(fa) || !beweglich(fb)) return false;
  if ((fa.art === 'regen' && (istLeckerli(fb) || fb.art === 'regen')) || (fb.art === 'regen' && istLeckerli(fa))) return true;
  // Wie im Original: zwei Spezial-Leckerli getauscht wirken immer zusammen
  if (fa.spezial && fb.spezial) return true;
  return laeufe(tausch(s, a, b)).length > 0;
}

export function hatZug(s) {
  for (let i = 0; i < s.felder.length; i += 1) {
    if (spalte(s, i) < s.n - 1 && gueltig(s, i, i + 1)) return true;
    if (zeile(s, i) < s.n - 1 && gueltig(s, i, i + s.n)) return true;
  }
  return false;
}

// ── Platzen lassen ─────────────────────────────────────────────────────────
/*
  Zellen räumen – samt Kettenreaktion der Spezial-Leckerli, die dabei
  getroffen werden. Liefert die getroffenen Zellen und die Wirkungen
  (für die Darstellung: Strahlen und Explosionen).
*/
function sprengen(s, start) {
  const getroffen = new Set();
  const effekte = [];
  const offen = [...start];
  while (offen.length) {
    const i = offen.pop();
    if (getroffen.has(i)) continue;
    getroffen.add(i);
    const f = s.felder[i];
    if (!f) continue;
    const ziele = [];
    const z0 = zeile(s, i); const s0 = spalte(s, i);
    const reiheWeg = (z) => { if (z < 0 || z >= s.n) return; effekte.push({ art: 'reihe', i: z * s.n + s0 }); for (let k = 0; k < s.n; k += 1) ziele.push(z * s.n + k); };
    const spalteWeg = (sp) => { if (sp < 0 || sp >= s.n) return; effekte.push({ art: 'spalte', i: z0 * s.n + sp }); for (let k = 0; k < s.n; k += 1) ziele.push(k * s.n + sp); };
    const quadrat = (r) => {
      effekte.push({ art: 'bombe', i, gross: r > 1 });
      for (let dz = -r; dz <= r; dz += 1) for (let ds = -r; ds <= r; ds += 1) {
        const z = z0 + dz; const sp = s0 + ds;
        if (z >= 0 && z < s.n && sp >= 0 && sp < s.n) ziele.push(z * s.n + sp);
      }
    };
    if (f.spezial === 'reihe') reiheWeg(z0);
    if (f.spezial === 'spalte') spalteWeg(s0);
    if (f.spezial === 'bombe') quadrat(1);
    // Kombis aus zwei getauschten Spezial-Leckerli (nur im Zug selbst gesetzt)
    if (f.spezial === 'kreuz') { reiheWeg(z0); spalteWeg(s0); }
    if (f.spezial === 'grosskreuz') { for (let d = -1; d <= 1; d += 1) { reiheWeg(z0 + d); spalteWeg(s0 + d); } }
    if (f.spezial === 'riesenbombe') quadrat(2);
    if (f.art === 'regen') {
      // Von einer Explosion getroffen: nimmt die häufigste Sorte mit
      const zaehl = {};
      s.felder.forEach((x) => { if (istLeckerli(x)) zaehl[x.art] = (zaehl[x.art] ?? 0) + 1; });
      const sorte = Object.entries(zaehl).sort((x, y) => y[1] - x[1])[0]?.[0];
      effekte.push({ art: 'regen', i, sorte });
      s.felder.forEach((x, k) => { if (x && x.art === sorte) ziele.push(k); });
    }
    offen.push(...ziele.filter((k) => !getroffen.has(k)));
  }
  return { getroffen, effekte };
}

/*
  Getroffene Zellen auswerten: Leckerli verschwinden (Dosen nicht), Kisten
  verlieren Leben, Pfützen schrumpfen, Kisten neben Geplatztem bekommen
  einen Stoss. geboren: Zellen, in denen gerade ein Spezial entsteht.
*/
function abraeumen(s, getroffen, geboren, kette) {
  const felder = [...s.felder];
  const pfuetzen = [...s.pfuetzen];
  const zaehler = { punkte: 0, gesammelt: {}, kisten: 0, pfuetzen: 0 };
  const platzt = [];
  const stoss = new Set();
  for (const i of getroffen) {
    const f = felder[i];
    if (!f) continue;
    if (f.art === 'dose') continue;
    if (f.art === 'kiste') { stoss.add(i); continue; }
    if (pfuetzen[i] > 0) { pfuetzen[i] -= 1; zaehler.punkte += PUNKTE.pfuetze; if (pfuetzen[i] === 0) zaehler.pfuetzen += 1; }
    if (geboren.has(i)) continue;
    if (istLeckerli(f)) zaehler.gesammelt[f.art] = (zaehler.gesammelt[f.art] ?? 0) + 1;
    zaehler.punkte += (f.spezial || f.art === 'regen' ? PUNKTE.spezial : PUNKTE.leckerli) * kette;
    platzt.push(f.id);
    felder[i] = null;
    umgebung(s, i).forEach((k) => { if (s.felder[k]?.art === 'kiste') stoss.add(k); });
  }
  for (const k of stoss) {
    const kiste = felder[k];
    if (!kiste || kiste.art !== 'kiste') continue;
    const leben = (kiste.leben ?? 1) - 1;
    zaehler.punkte += PUNKTE.kiste;
    if (leben <= 0) { platzt.push(kiste.id); felder[k] = null; zaehler.kisten += 1; } else felder[k] = { ...kiste, leben };
  }
  return { s: { ...s, felder, pfuetzen }, zaehler, platzt };
}

/* Alles rutscht nach unten, oben kommt Neues (nur Leckerli aus arten). */
export function nachrutschen(s, arten, zufall) {
  const felder = [...s.felder];
  let { id } = s;
  for (let sp = 0; sp < s.n; sp += 1) {
    const spalteFelder = [];
    for (let z = s.n - 1; z >= 0; z -= 1) if (s.felder[z * s.n + sp]) spalteFelder.push(s.felder[z * s.n + sp]);
    for (let z = s.n - 1, k = 0; z >= 0; z -= 1, k += 1) {
      if (k < spalteFelder.length) felder[z * s.n + sp] = spalteFelder[k];
      else { id += 1; felder[z * s.n + sp] = { id, art: wurf(arten, zufall), neu: true }; }
    }
  }
  return { ...s, felder, id };
}

/* Dosen, die unten angekommen sind, werden eingesammelt. */
function dosenAbholen(s) {
  const felder = [...s.felder];
  const ids = [];
  for (let sp = 0; sp < s.n; sp += 1) {
    const i = (s.n - 1) * s.n + sp;
    if (felder[i]?.art === 'dose') { ids.push(felder[i].id); felder[i] = null; }
  }
  return { s: { ...s, felder }, ids };
}

const addieren = (a, b) => {
  const gesammelt = { ...a.gesammelt };
  Object.entries(b.gesammelt).forEach(([k, v]) => { gesammelt[k] = (gesammelt[k] ?? 0) + v; });
  return { punkte: a.punkte + b.punkte, gesammelt, kisten: a.kisten + b.kisten, pfuetzen: a.pfuetzen + b.pfuetzen, dosen: a.dosen + (b.dosen ?? 0) };
};

/* Ein Spezial setzen: in der Tauschzelle, falls sie dazugehört, sonst in die Mitte. */
function spezialOrt(g, bevorzugt) {
  const hier = bevorzugt.find((i) => g.zellen.includes(i));
  if (hier !== undefined) return hier;
  const sortiert = [...g.zellen].sort((x, y) => x - y);
  return sortiert[Math.floor(sortiert.length / 2)];
}

/*
  Kettenreaktion bis zur Ruhe. erst: getroffene Zellen eines Regenbogen-
  Tauschs (sonst leer). Jeder Schritt hält fest, was platzt und wie das
  Brett danach aussieht.
*/
function aufloesen(s0, arten, zufall, bevorzugt, erst = null) {
  let s = s0;
  let summe = { punkte: 0, gesammelt: {}, kisten: 0, pfuetzen: 0, dosen: 0 };
  const schritte = [];
  for (let kette = 1; kette < 40; kette += 1) {
    let getroffen; let effekte = []; const geboren = new Map();
    if (kette === 1 && erst) {
      ({ getroffen, effekte } = sprengen(s, erst));
    } else {
      const gs = gruppen(s);
      if (gs.length === 0) {
        const d = dosenAbholen(s);
        if (d.ids.length === 0) break;
        summe = addieren(summe, { punkte: PUNKTE.dose * d.ids.length, gesammelt: {}, kisten: 0, pfuetzen: 0, dosen: d.ids.length });
        s = nachrutschen(d.s, arten, zufall);
        schritte.push({ s, platzt: d.ids, effekte: [], dosen: d.ids.length, punkte: PUNKTE.dose * d.ids.length });
        continue;
      }
      const start = new Set();
      for (const g of gs) {
        g.zellen.forEach((c) => start.add(c));
        const spezial = belohnung(g);
        if (spezial) {
          const ort = spezialOrt(g, kette === 1 ? bevorzugt : []);
          const art = s.felder[ort].art;
          geboren.set(ort, spezial === 'regen' ? { art: 'regen' } : { art, spezial });
        }
      }
      // Spezial-Leckerli in der Gruppe zünden; neu geborene Zellen bleiben stehen
      ({ getroffen, effekte } = sprengen(s, [...start]));
    }
    const r = abraeumen(s, getroffen, new Set(geboren.keys()), kette);
    let felder = r.s.felder;
    for (const [ort, neu] of geboren) {
      s = neuesId(s);
      felder = felder.map((f, i) => (i === ort ? { id: s.id, ...neu, frisch: true } : f));
    }
    summe = addieren(summe, { ...r.zaehler, dosen: 0 });
    s = nachrutschen({ ...r.s, felder, id: Math.max(s.id, r.s.id) }, arten, zufall);
    schritte.push({ s, platzt: r.platzt, effekte, kette, geboren: [...geboren.keys()], punkte: r.zaehler.punkte, mitte: mitte(s0.n, getroffen) });
  }
  return { s, schritte, summe };
}

/*
  Einen Zug ausführen. null, wenn er nicht geht. Danach ist das Brett in
  Ruhe; steckt es fest, wird gemischt.
*/
export function zug(s0, a, b, arten, zufall = Math.random) {
  if (!gueltig(s0, a, b)) return null;
  const s = tausch(s0, a, b);
  const fa = s.felder[b]; const fb = s.felder[a];   // nach dem Tausch: fa liegt jetzt in b
  let erst = null;
  let bereit = s;
  if (fa.art === 'regen' || fb.art === 'regen') {
    const [knaeuel, anderes] = fa.art === 'regen' ? [b, a] : [a, b];
    const anderesFeld = s.felder[anderes];
    const sorte = anderesFeld.art;
    const dieser = s.felder.map((f, i) => (f?.art === sorte ? i : -1)).filter((i) => i >= 0);
    erst = sorte === 'regen'
      ? s.felder.map((f, i) => (beweglich(f) && f.art !== 'dose' ? i : -1)).filter((i) => i >= 0)
      : [knaeuel, ...dieser];
    bereit = {
      ...s,
      felder: s.felder.map((f, i) => {
        // Das Knäuel selbst zündet nicht noch einmal: es geht als gewöhnliches Stück mit
        if (i === knaeuel) return { ...f, art: 'regen-weg' };
        // Regenbogen + Spezial: alle dieser Sorte werden zu diesem Spezial (Streifen gemischt)
        if (anderesFeld.spezial && f?.art === sorte) {
          const sp = anderesFeld.spezial === 'bombe' ? 'bombe' : (zufall() < 0.5 ? 'reihe' : 'spalte');
          return { ...f, spezial: sp };
        }
        return f;
      }),
    };
  } else if (fa.spezial && fb.spezial) {
    // Zwei Spezial: in b entsteht die Kombi, a wird gewöhnlich (es steckt ja in der Kombi)
    const arten2 = [fa.spezial, fb.spezial];
    const bomben = arten2.filter((x) => x === 'bombe').length;
    const kombi = bomben === 2 ? 'riesenbombe' : bomben === 1 ? 'grosskreuz' : 'kreuz';
    bereit = {
      ...s,
      felder: s.felder.map((f, i) => (i === b ? { ...f, spezial: kombi } : i === a ? { ...f, spezial: undefined } : f)),
    };
    erst = [a, b];
  }
  const r = aufloesen(bereit, arten, zufall, [a, b], erst);
  const schritte = [{ s: bereit, platzt: [], effekte: [] }, ...r.schritte];
  let ende = r.s;
  if (!hatZug(ende)) {
    ende = mischen(ende, arten, zufall);
    schritte.push({ s: ende, platzt: [], effekte: [], gemischt: true });
  }
  return { s: ende, schritte, ...r.summe };
}

/* Leckerli neu verteilen (Kisten und Dosen bleiben), bis nichts fertig liegt und ein Zug geht. */
export function mischen(s, arten, zufall) {
  for (let versuch = 0; versuch < 200; versuch += 1) {
    const plaetze = s.felder.map((f, i) => (istLeckerli(f) ? i : -1)).filter((i) => i >= 0);
    const stuecke = plaetze.map((i) => s.felder[i]);
    for (let k = stuecke.length - 1; k > 0; k -= 1) {
      const j = Math.floor(zufall() * (k + 1));
      [stuecke[k], stuecke[j]] = [stuecke[j], stuecke[k]];
    }
    const felder = [...s.felder];
    plaetze.forEach((p, k) => { felder[p] = stuecke[k]; });
    const neu = { ...s, felder };
    if (laeufe(neu).length === 0 && hatZug(neu)) return neu;
  }
  // Kommt praktisch nie vor: frisch würfeln
  const felder = s.felder.map((f) => (istLeckerli(f) ? { ...f, art: wurf(arten, zufall) } : f));
  return mischen({ ...s, felder }, arten, zufall);
}

/*
  Startbrett aus einer Vorlage (Zeilen aus Zeichen):
    .  normales Feld        p / P  Pfütze (1 / 2 Stufen)
    k / K  Kiste (1 / 2 Leben)     d  Dose
  Leckerli werden so gewürfelt, dass nichts fertig liegt und ein Zug geht.
*/
export function startBrett(vorlage, arten, zufall = Math.random) {
  const n = vorlage.length;
  const zeichen = vorlage.join('').split('');
  for (let versuch = 0; versuch < 200; versuch += 1) {
    let id = 0;
    const felder = [];
    zeichen.forEach((c, i) => {
      id += 1;
      if (c === 'k' || c === 'K') { felder.push({ id, art: 'kiste', leben: c === 'K' ? 2 : 1 }); return; }
      if (c === 'd') { felder.push({ id, art: 'dose' }); return; }
      let art = wurf(arten, zufall);
      for (let k = 0; k < arten.length; k += 1) {
        const links = i % n >= 2 && felder[i - 1]?.art === art && felder[i - 2]?.art === art;
        const oben = i >= 2 * n && felder[i - n]?.art === art && felder[i - 2 * n]?.art === art;
        if (!links && !oben) break;
        art = arten[(arten.indexOf(art) + 1) % arten.length];
      }
      felder.push({ id, art });
    });
    const pfuetzen = zeichen.map((c) => (c === 'P' ? 2 : c === 'p' ? 1 : 0));
    const s = { n, felder, pfuetzen, id };
    if (laeufe(s).length === 0 && hatZug(s)) return s;
  }
  throw new Error('Leckerli-Reise: kein spielbares Startbrett');
}

export const leer = (n) => Array.from({ length: n }, () => '.'.repeat(n));
export const restKisten = (s) => s.felder.filter((f) => f?.art === 'kiste').length;
export const restPfuetzen = (s) => s.pfuetzen.filter((p) => p > 0).length;
export const restDosen = (s) => s.felder.filter((f) => f?.art === 'dose').length;

/* Wo eine Gruppe ungefähr liegt (für die fliegenden Punkte): Zeile/Spalte der Mitte. */
function mitte(n, zellen) {
  const liste = [...zellen];
  if (!liste.length) return null;
  const z = liste.reduce((a, i) => a + Math.floor(i / n), 0) / liste.length;
  const sp = liste.reduce((a, i) => a + (i % n), 0) / liste.length;
  return { z, sp };
}

/* Hinweis (2.14.0): ein möglicher Zug, zufällig gewählt – oder null. */
export function hinweis(s, zufall = Math.random) {
  const moeglich = [];
  for (let i = 0; i < s.felder.length; i += 1) {
    if (spalte(s, i) < s.n - 1 && gueltig(s, i, i + 1)) moeglich.push([i, i + 1]);
    if (zeile(s, i) < s.n - 1 && gueltig(s, i, i + s.n)) moeglich.push([i, i + s.n]);
  }
  if (!moeglich.length) return null;
  return moeglich[Math.min(moeglich.length - 1, Math.floor(zufall() * moeglich.length))];
}

/*
  Pfote (2.14.0, wie der Lolli-Hammer im Original): ein Feld wegklopfen,
  ohne Zug. Spezial-Leckerli zünden, Kisten bekommen einen Stoss; Dosen
  lassen sich nicht wegklopfen. null, wenn es nicht geht.
*/
export function pfote(s, i, arten, zufall = Math.random) {
  const f = s.felder[i];
  if (!f || f.art === 'dose') return null;
  const r = aufloesen(s, arten, zufall, [], [i]);
  const schritte = [{ s, platzt: [], effekte: [] }, ...r.schritte];
  let ende = r.s;
  if (!hatZug(ende)) {
    ende = mischen(ende, arten, zufall);
    schritte.push({ s: ende, platzt: [], effekte: [], gemischt: true });
  }
  return { s: ende, schritte, ...r.summe };
}

/*
  Leckerli-Rausch (2.14.0, wie "Sugar Crush"): Ist das Ziel geschafft, wird
  für jeden übrigen Zug ein Leckerli gestreift; dann zünden alle Spezial-
  Leckerli auf dem Brett auf einmal. Die Punkte zählen.
*/
export function rausch(s, n, arten, zufall = Math.random) {
  if (n <= 0) return { s, schritte: [], punkte: 0 };
  const frei = s.felder.map((f, i) => (istLeckerli(f) && !f.spezial ? i : -1)).filter((i) => i >= 0);
  for (let k = frei.length - 1; k > 0; k -= 1) {
    const j = Math.floor(zufall() * (k + 1));
    [frei[k], frei[j]] = [frei[j], frei[k]];
  }
  const gewaehlt = new Set(frei.slice(0, n));
  const mitStreifen = {
    ...s,
    felder: s.felder.map((f, i) => (gewaehlt.has(i) ? { ...f, spezial: zufall() < 0.5 ? 'reihe' : 'spalte', frisch: true } : f)),
  };
  const zuenden = mitStreifen.felder.map((f, i) => (f && (f.spezial || f.art === 'regen') ? i : -1)).filter((i) => i >= 0);
  const r = aufloesen(mitStreifen, arten, zufall, [], zuenden);
  return { s: r.s, schritte: [{ s: mitStreifen, platzt: [], effekte: [] }, ...r.schritte], ...r.summe };
}
