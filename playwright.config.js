import { defineConfig, devices } from '@playwright/test';

/*
  E2E-Tests gegen den Produktionsbuild.

  Warum es sie gibt: Lint, Unit-Tests und Build haben an einem einzigen Tag
  sechs echte Fehler durchgelassen – einen Absturz beim Öffnen des Spiels,
  eine Sperre, die das Füttern unmöglich machte, eine nie sichtbare Münze,
  drei Überlappungen in der Kopfleiste, einen Effektsturm bei jedem Laden und
  eine Fortschrittslogik, die nie griff. Alle sind erst im Browser aufgefallen.

  Browser: in der CI lädt Playwright seinen eigenen Chromium. Auf Rechnern
  ohne diesen Download greift CHROMIUM_PATH auf einen vorhandenen zurück.
*/
const eigenerBrowser = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Der Vorschau-Server verträgt mehrere Browser; mehr Arbeiter kürzen den
  // Lauf deutlich, ohne dass sich die Tests in die Quere kommen (jeder bekommt
  // einen eigenen Kontext samt eigenem localStorage).
  workers: process.env.CI ? 3 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      ...(eigenerBrowser ? { executablePath: eigenerBrowser } : {}),
      args: ['--no-sandbox'],
    },
  },

  projects: [
    { name: 'tablet',  use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 }, hasTouch: true } },
    { name: 'monitor', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  ],

  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
