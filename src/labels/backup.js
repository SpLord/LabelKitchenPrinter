import { parseGroups } from './store.js';

/*
  Sicherung der Etiketten als Datei.
  Die Buttons liegen sonst nur im localStorage dieses einen Browsers – wer das
  Gerät wechselt oder die Browserdaten löscht, fängt ohne Sicherung von vorn an.
*/

const FORMAT = 'labelkitchen-etiketten';
const VERSION = 1;

export const buildBackup = (groups) => ({
  format: FORMAT,
  version: VERSION,
  exportedAt: new Date().toISOString(),
  groups,
});

export const backupFileName = (date = new Date()) =>
  `etiketten-${date.toISOString().slice(0, 10)}.json`;

/* Nimmt sowohl eine vollständige Sicherung als auch eine nackte Gruppenliste an. */
export const readBackup = (text) => {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' };
  }

  const candidate = Array.isArray(raw) ? raw : raw?.groups;
  if (raw?.format && raw.format !== FORMAT) {
    return { ok: false, error: 'Die Datei gehört zu einer anderen Anwendung.' };
  }

  const groups = parseGroups(candidate);
  if (!groups) return { ok: false, error: 'Die Datei enthält keine lesbaren Etiketten-Gruppen.' };

  return { ok: true, groups };
};

/* Löst den Datei-Download im Browser aus. */
export const downloadBackup = (groups, doc = document) => {
  const blob = new Blob([JSON.stringify(buildBackup(groups), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = doc.createElement('a');
  link.href = url;
  link.download = backupFileName();
  doc.body.appendChild(link);
  link.click();
  doc.body.removeChild(link);
  URL.revokeObjectURL(url);
};
