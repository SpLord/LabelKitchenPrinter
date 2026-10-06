/*
  Stunden als Satzteil ("gut drei Tage").

  Anlass: In der Erklärung stand "rund 83 Stunden, also gut eine Schicht" – der
  zweite Halbsatz war von Hand dazugeschrieben und seit der gesenkten
  Verfallsrate falsch. Hier folgt er allein aus der Zahl und stimmt damit bei
  jeder Rate.
*/
const ZAHLWORT = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];

const tage = (n) => `${ZAHLWORT[n] || n} ${n === 1 ? 'Tag' : 'Tage'}`;

export function dauerInWorten(stunden) {
  if (!Number.isFinite(stunden) || stunden < 0) return 'unbekannt lange';
  if (stunden < 24) return 'weniger als ein Tag';
  const ganze = Math.floor(stunden / 24);
  const rest = stunden - ganze * 24;
  if (rest === 0) return `genau ${tage(ganze)}`;
  // Ab einem halben Tag Rest ist "knapp der nächste" die ehrlichere Angabe.
  return rest <= 12 ? `gut ${tage(ganze)}` : `knapp ${tage(ganze + 1)}`;
}
