import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/*
  Versionskennung für die Anzeige unten rechts.
  Reihenfolge: CI-Build-Arg > Git-Commit > nur package.json.
  Der Commit-Anteil ändert sich bei JEDER Änderung von selbst – man muss also
  nichts von Hand hochzählen, um zu sehen, ob die aktuelle Version ausgerollt ist.
*/
function resolveBuildId() {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const dirty = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return dirty ? `${sha}-dev` : sha;
  } catch {
    return null;
  }
}

const buildId = resolveBuildId();
const appVersion = buildId ? `${pkg.version}+${buildId}` : pkg.version;

export default {
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
};
