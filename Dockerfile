# ── Build-Stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Nur die Manifeste zuerst: Layer-Cache bleibt gültig, solange sich Deps nicht ändern.
# npm ci statt npm install → reproduzierbar, exakt der Stand aus package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# .git liegt nicht im Build-Kontext – die Versionskennung kommt darum aus der CI.
ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

# Quality-Gate im Image-Build: kaputter Code wird nicht zum Deployment.
RUN npm run lint && npm test && npm run build

# ── Produktions-Image ─────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ablage für die gemeinsamen Etiketten. Wird als Volume gemountet; die
# Rechte aus dem Image werden beim ersten Anlegen übernommen, damit der
# nginx-Arbeitsprozess hineinschreiben darf.
RUN mkdir -p /var/lib/labelkitchen/.tmp \
    && chown -R nginx:nginx /var/lib/labelkitchen

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
