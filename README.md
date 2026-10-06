# LabelKitchenPrinter (React + Vite)

Eine Touch-freundliche Webanwendung zum Drucken von DYMO-Etiketten mit vordefinierten und frei eingegebenen Namen.

## Starten

```bash
npm install
npm run dev
```

## Voraussetzungen

- DYMO LabelWriter installiert
- DYMO JS SDK verfügbar

## Error-Tracking

Laufzeitfehler gehen an die zentrale Bugsink-Instanz (Sentry-kompatibel),
Projekt **LabelKitchen** (Nr. 9). Neue Meldungen landen über die Triage als
GitHub-Issue mit Label `bugsink` in diesem Repo.

**Aufbau wie im Farmhaus-Projekt – der echte DSN bleibt auf dem Server:**

- Der DSN steht nur in der Stack-Umgebung in Portainer (`SENTRY_DSN`), nie im
  Repo. Ohne ihn läuft die App still ohne Tracking.
- Beim Containerstart erzeugt `docker/40-bugsink.sh` daraus
  `/etc/nginx/bugsink.conf`: `/api/client-config` sagt dem Browser nur, ob
  gemeldet wird, Projektnummer und Umgebung.
- Der Browser startet das SDK mit einem Platzhalter-DSN auf den eigenen
  Ursprung und meldet an `/api/<projekt>/envelope/`. nginx leitet mit dem
  echten Schlüssel weiter. Das Tablet muss Bugsink also nicht selbst erreichen.
- Das SDK (`@sentry/react`) wird erst nachgeladen, wenn der Server es freigibt.

**Gemeldet werden:** unbehandelte Fehler, alles, was eine ErrorBoundary
abfängt (mit Bereich), und gescheiterte Druckaufträge (mit Grund, Anzahl,
Drucker; je Grund höchstens einmal pro Minute). **Nicht** gemeldet:
erwartbare Zustände wie „Drucker nicht verbunden" oder ein nicht
erreichbarer Etikettenspeicher. Keine Nutzerdaten, keine Header, keine
Konsolenausgaben, kein Tracing.

Release ist `labelkitchen@<package.json-Version>` – die Version deshalb bei
jeder Änderung anheben.
