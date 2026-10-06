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
if [ -z "$DSN" ]; then
  aus "kein SENTRY_DSN gesetzt"
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
[ -n "$NS" ] || NS=127.0.0.11
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
    # Jede neue Meldung startet eine Triage-Routine: Rauschen begrenzen
    limit_req zone=bugsink burst=20 nodelay;
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
echo "bugsink: Fehlertracking aktiv (Projekt $PROJEKT, Umgebung $UMGEBUNG)"
