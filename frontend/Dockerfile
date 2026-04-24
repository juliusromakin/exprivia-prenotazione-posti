# Stage 1: Build Angular App
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Limite di memoria più ragionevole per evitare crash del builder
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build --configuration=production --project=exprivia

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copia la configurazione personalizzata di Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia l'app compilata - serve solo la sottocartella browser
COPY --from=build /app/dist/exprivia/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
