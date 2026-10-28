# syntax=docker/dockerfile:1
# Flappy Bird clone for Coolify. `tsc` compiles src/ to dist/main.js; index.html, styles.css
# and favicon.svg are served from the repo root next to dist/.
# Built on technit-build and pushed to technit-registry; the hosting server only pulls it.
FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/index.html /src/styles.css /src/favicon.svg /usr/share/nginx/html/
COPY --from=build /src/dist /usr/share/nginx/html/dist
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://127.0.0.1/ || exit 1
