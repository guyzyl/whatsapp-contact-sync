### Build web files
FROM node:24-alpine AS web-build

ARG WEB_GOOGLE_CLIENT_ID=""
ARG WEB_GOOGLE_API_KEY=""

ENV WEB_GOOGLE_CLIENT_ID=${WEB_GOOGLE_CLIENT_ID}
ENV WEB_GOOGLE_API_KEY=${WEB_GOOGLE_API_KEY}

WORKDIR /app/web

COPY web/package.json web/package-lock.json* ./

RUN npm ci

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


### Build server files
FROM node:24-alpine AS server-build

ARG SERVER_GOOGLE_CLIENT_ID=""
ARG SERVER_GOOGLE_CLIENT_SECRET=""

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" \
    SERVER_GOOGLE_CLIENT_ID=${SERVER_GOOGLE_CLIENT_ID} \
    SERVER_GOOGLE_CLIENT_SECRET=${SERVER_GOOGLE_CLIENT_SECRET}
WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./

RUN npm ci

COPY ./interfaces /app/interfaces
COPY ./server .

RUN npm run build \
    && npm prune --production

# Prepare node_modules for docker
RUN apk add --no-cache curl \
    && curl -sf https://gobinaries.com/tj/node-prune | sh \
    && mv node_modules/googleapis/build/src/apis/docs ./docs \
    && node-prune --exclude "**/googleapis/**/docs/*.js" \
    && mv ./docs node_modules/googleapis/build/src/apis/docs


### Build final image
FROM node:24-alpine

ARG WEB_GOOGLE_CLIENT_ID=""
ARG WEB_GOOGLE_API_KEY=""
ARG SERVER_GOOGLE_CLIENT_ID=""
ARG SERVER_GOOGLE_CLIENT_SECRET=""

ENV RUNNING_IN_DOCKER="true" \
    NODE_ENV="production" \
    WEB_GOOGLE_CLIENT_ID=${WEB_GOOGLE_CLIENT_ID} \
    WEB_GOOGLE_API_KEY=${WEB_GOOGLE_API_KEY} \
    SERVER_GOOGLE_CLIENT_ID=${SERVER_GOOGLE_CLIENT_ID} \
    SERVER_GOOGLE_CLIENT_SECRET=${SERVER_GOOGLE_CLIENT_SECRET}
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
COPY ./assets/entrypoint.sh ./assets/healthcheck.sh ./
RUN chmod +x ./entrypoint.sh ./healthcheck.sh


COPY --from=web-build /app/web/dist /var/www/html
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/build ./build

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ./healthcheck.sh

ENTRYPOINT ["/bin/sh", "-c", "/var/www/html/vite-envs.sh && ./entrypoint.sh"]
