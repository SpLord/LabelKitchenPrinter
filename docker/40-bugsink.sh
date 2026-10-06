#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Bugsink-Anbindung, läuft beim Containerstart vor nginx
# (offizielles nginx-Image: /docker-entrypoint.d/*.sh).
#
# Erzeugt /etc/nginx/bugsink.conf aus SENTRY_DSN. Aufbau wie im Farmhaus-
# Projekt: der echte DSN bleibt hier im Container. Der Browser bekommt unter
# /api/client-config nur Freigabe, Projektnummer und Umgebung und schickt
# seine Meldungen an /api/<projekt>/envelope/ auf dem eigenen Ursprung. nginx
# leitet sie mit dem echten Schlüssel im Header an Bugsink weiter.
#
# Grundsatz: dieses Skript darf den Start NIE verhindern. Fehlt der DSN oder
# sieht er falsch aus, läuft die Küche ohne Fehlertracking weiter – ein
# Etikettendrucker, der wegen seiner Fehlermeldungen nicht startet, wäre
# absurd. Der DSN wird nie ausgegeben, auch nicht in Fehlermeldungen.
# ─────────────────────────────────────────────────────────────────────────────
set -eu

ZIEL=/etc/nginx/bugsink.conf

aus() {
  cat > "$ZIEL" <<'EOF'
location = /api/client-config {
    default_type application/json;
    add_header Cache-Control "no-store" always;
    return 200 '{"enabled":false}';
}
location /api/ { return 404; }
EOF
  echo "bugsink: ohne Fehlertracking ($1)"
}

DSN="${SENTRY_DSN:-}"
# Ränder kürzen – beim Einfügen in ein Portainer-Feld rutscht gern ein
# Leerzeichen oder Umbruch mit. Ein Umbruch MITTEN im Wert bleibt erhalten
# und wird unten abgewiesen (sed arbeitet zeilenweise).
DSN=$(printf '%s' "$DSN" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
if [ -z "$DSN" ]; then
  aus "kein SENTRY_DSN gesetzt"
  exit 0
fi

# Zeilenumbrüche und Steuerzeichen zuerst abweisen: grep prüft zeilenweise,
# eine passende Zeile genügte ihm. Ein DSN wie "junk;<Umbruch>https://…/9"
# kam durch und schrieb "location = /api/junk;" in die Konfiguration
# (Review vom 06.10.2026, nachgestellt).
if [ "$(printf '%s' "$DSN" | tr -cd '[:graph:]')" != "$DSN" ]; then
  aus "SENTRY_DSN enthält Leer- oder Steuerzeichen"
  exit 0
fi

# Erwartet: https://<schlüssel>@<host>[:port]/<projekt>
if ! printf '%s' "$DSN" | grep -Eq '^https://[0-9a-fA-F-]{32,36}@[A-Za-z0-9.-]+(:[0-9]{1,5})?/[0-9]{1,6}$'; then
  aus "SENTRY_DSN hat nicht die erwartete Form https://<schlüssel>@<host>/<projekt>"
  exit 0
fi

SCHLUESSEL=$(printf '%s' "$DSN" | sed -E 's#^https://([^@]+)@.*#\1#')
HOST=$(printf '%s' "$DSN" | sed -E 's#^https://[^@]+@([^/]+)/.*#\1#')
PROJEKT=$(printf '%s' "$DSN" | sed -E 's#.*/([0-9]+)$#\1#')
HOSTNAME_NUR=${HOST%%:*}

# Nur harmlose Zeichen in die JSON-Antwort an den Browser
UMGEBUNG=$(printf '%s' "${SENTRY_ENVIRONMENT:-production}" | tr -cd 'a-z0-9_-' | cut -c1-32)
[ -n "$UMGEBUNG" ] || UMGEBUNG=production

# Aufgelöst wird zur Anfragezeit, nicht beim Start: ist Bugsink einmal nicht
# erreichbar, startet nginx trotzdem. Dafür braucht nginx einen Resolver.
NS=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf 2>/dev/null || true)
# Nur eine schlichte IPv4/IPv6-Adresse; etwa "fe80::1%eth0" lehnt nginx ab
printf '%s' "$NS" | grep -Eq '^[0-9a-fA-F:.]{2,45}$' || NS=127.0.0.11
case "$NS" in *:*) NS="[$NS]" ;; esac

umask 077
cat > "$ZIEL" <<EOF
location = /api/client-config {
    default_type application/json;
    add_header Cache-Control "no-store" always;
    return 200 '{"enabled":true,"projekt":"$PROJEKT","environment":"$UMGEBUNG"}';
}

# Tunnel zu Bugsink. Das Ziel steht fest – kein offenes Relay in andere Projekte.
location = /api/$PROJEKT/envelope/ {
    limit_except POST { deny all; }
    # Jede neue Meldung startet eine Triage-Routine – also einen KI-Agenten
    # mit Repo-Zugriff. Die Drossel je Gerät hilft gegen ein Gerät, das Amok
    # läuft; der Gesamtdeckel gegen jemanden im LAN, der den Tunnel flutet.
    limit_req zone=bugsink burst=20 nodelay;
    limit_req zone=bugsink_gesamt burst=10 nodelay;
    limit_req_status 429;
    client_max_body_size 256k;

    resolver $NS valid=300s ipv6=off;
    resolver_timeout 5s;

    # Das SDK schickt den Platzhalter-Schlüssel als ?sentry_key=… mit. Bugsink
    # würde ihn dem Header vorziehen und als ungültig ablehnen – also weg damit.
    set \$args "";
    set \$bugsink_ziel "https://$HOST/api/$PROJEKT/envelope/";
    proxy_pass \$bugsink_ziel;
    proxy_ssl_server_name on;
    proxy_ssl_name $HOSTNAME_NUR;
    # Zertifikat prüfen – sonst könnte ein gefälschter DNS-Eintrag den
    # Schlüssel abgreifen. Tiefe 3: nginx prüft standardmässig nur EINE Ebene,
    # Let's Encrypt braucht Endzertifikat plus Zwischenzertifikat. Mit dem
    # Standard schlüge jede Weiterleitung still mit 502 fehl.
    proxy_ssl_verify on;
    proxy_ssl_verify_depth 3;
    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    proxy_set_header Host $HOST;
    proxy_set_header X-Sentry-Auth "Sentry sentry_version=7, sentry_client=labelkitchen-tunnel/1, sentry_key=$SCHLUESSEL";
    proxy_set_header Content-Type "application/x-sentry-envelope";
    # Nichts vom Tablet weiterreichen, was Bugsink nicht braucht
    proxy_set_header Cookie "";
    proxy_set_header X-Forwarded-For "";
    proxy_set_header X-Real-IP "";
    proxy_hide_header Set-Cookie;
    proxy_connect_timeout 5s;
    proxy_read_timeout 10s;
}

location /api/ { return 404; }
EOF
# Erst jetzt ist die Zusage "nie am Start hindern" eingelöst: nginx prüft
# die erzeugte Konfiguration mit den echten Werten. Ist sie kaputt, läuft die
# Küche ohne Tracking weiter, statt gar nicht.
if ! nginx -t >/dev/null 2>&1; then
  aus "erzeugte Konfiguration ungültig"
  exit 0
fi
echo "bugsink: Fehlertracking aktiv (Projekt $PROJEKT, Umgebung $UMGEBUNG)"
