# Basis-Image
FROM node:20-alpine AS build

# Arbeitsverzeichnis
WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# Restlichen Code kopieren und bauen
COPY . .
RUN npm run build

# Produktions-Image mit Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: eigene Nginx-Konfiguration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
