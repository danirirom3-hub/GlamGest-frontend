# ===== ETAPA 1: BUILD DE ANGULAR =====
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# ===== ETAPA 2: SERVIR CON NGINX =====
FROM nginx:alpine

# Limpia la carpeta por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# ⚠️ Angular 17 normalmente genera dist/<nombre-proyecto>/browser
COPY --from=build /app/dist/glam-gest/browser/ /usr/share/nginx/html/

# Expone puerto 80
EXPOSE 80

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]