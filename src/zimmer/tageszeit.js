/*
  Tageszeiten nach der echten Uhr (Design 2026-10-06, Etappe 7).

  Das Zimmer folgt der Küche: morgens heller Himmel, tagsüber Sonne,
  abends geht die Lampe an, nachts Mond und gedämpftes Licht – passend zur
  Schlafenszeit der Katze (22–6 Uhr, tamagotchi.js).
*/
export function tageszeit(jetzt = new Date()) {
  const h = jetzt.getHours();
  if (h >= 5 && h < 10) return 'morgen';
  if (h >= 10 && h < 17) return 'tag';
  if (h >= 17 && h < 21) return 'abend';
  return 'nacht';
}

/* Himmel im Fenster (oben, unten), Abdunkeln des Zimmers, Lampe an? */
export const LICHT = {
  morgen: { himmel: ['#fcd9b8', '#fef3c7'], dunkel: 0, lampe: false, gestirn: 'sonne-tief' },
  tag: { himmel: ['#9fd4f6', '#d6eefc'], dunkel: 0, lampe: false, gestirn: 'sonne' },
  abend: { himmel: ['#f59e7b', '#fcd34d'], dunkel: 0.12, lampe: true, gestirn: 'sonne-tief' },
  nacht: { himmel: ['#1e2a4a', '#3b4a78'], dunkel: 0.3, lampe: true, gestirn: 'mond' },
};

/* Wer gerade am Fenster vorbeischaut. */
export function besucher(zeit, zufall = Math.random) {
  if (zeit === 'nacht' || zeit === 'abend') return 'motte';
  return zufall() < 0.5 ? 'vogel' : 'schmetterling';
}

/* Wie oft jemand vorbeikommt: alle 25–60 Sekunden, für 7 Sekunden. */
export const BESUCH = { abstandMin: 25_000, abstandMax: 60_000, dauer: 7_000 };

/*
  Wetter im Fenster (2.4.0): je Schichttag fest, damit es nicht flackert.
  Im Winter (Dezember bis Februar) kann es schneien, sonst regnet es mal.
*/
const WINTER = ['sonne', 'wolken', 'schnee', 'schnee', 'wolken'];
const SONST = ['sonne', 'sonne', 'wolken', 'regen', 'sonne'];
export function wetter(jetzt = new Date()) {
  // Schichttag: vor 5 Uhr zählt noch der Vortag
  const d = new Date(jetzt.getTime() - 5 * 3_600_000);
  const zahl = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  const gemischt = (zahl * 2654435761) % 4294967296;
  const liste = [11, 0, 1].includes(d.getMonth()) ? WINTER : SONST;
  return liste[gemischt % liste.length];
}
