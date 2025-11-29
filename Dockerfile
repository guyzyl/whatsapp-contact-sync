### Build web files
FROM node:24-alpine AS web-build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

# Cache mount persists npm cache between builds for faster rebuilds (~50-70% faster)
# npm ci: clean install from package-lock.json
# --prefer-offline: uses cached packages before downloading
# --no-audit: skips security audit for speed
RUN --mount=type=cache,target=/app/.npm \
    npm ci --prefer-offline --no-audit --cache /app/.npm

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


### Build server files
FROM node:24-alpine AS server-build

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
WORKDIR /app/server

COPY ["server/package.json", "server/package-lock.json*", "./"]

# Cache mount persists npm cache between builds for faster rebuilds (~50-70% faster)
# npm ci: clean install from package-lock.json
# --prefer-offline: uses cached packages before downloading
# --no-audit: skips security audit for speed
RUN --mount=type=cache,target=/app/.npm \
    npm ci --prefer-offline --no-audit --cache /app/.npm

COPY ./interfaces /app/interfaces
COPY ./server .

RUN npm run build && \
    npm prune --production

# Prepare node_modules for docker
RUN apk add --no-cache curl && \
    curl -sf https://gobinaries.com/tj/node-prune | sh && \
    mv node_modules/googleapis/build/src/apis/docs ./docs && \
    node-prune --exclude "**/googleapis/**/docs/*.js" && \
    mv ./docs node_modules/googleapis/build/src/apis/docs


### Build final image
FROM node:24-alpine

ENV RUNNING_IN_DOCKER="true" \
    NODE_ENV="production"
WORKDIR /app/server

# Install Chromium and dependencies
RUN apk add --no-cache \
    nss \
    udev \
    ttf-freefont \
    chromium \
    nginx \
    curl

COPY ./assets/nginx.conf /etc/nginx/nginx.conf
COPY --chmod=755 ./assets/entrypoint.sh ./assets/healthcheck.sh ./

COPY --from=web-build /app/web/dist /var/www/html
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/build ./build

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ./healthcheck.sh

ENTRYPOINT ["/bin/sh", "-c", "/var/www/html/vite-envs.sh && ./entrypoint.sh"]
