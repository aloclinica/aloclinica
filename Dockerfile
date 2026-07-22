# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# NB: sem HEALTHCHECK no Dockerfile — o EasyPanel/Traefik faz a checagem
# de saude dele mesmo. Um HEALTHCHECK aqui faz o Swarm segurar o container
# como "unhealthy" e o proxy nao roteia (502).

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
