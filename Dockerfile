### Build web files
FROM node:24-alpine AS web-build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


### Download server npm modules
FROM node:24-alpine AS server-build

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
WORKDIR /app/server

COPY ["server/package.json", "server/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./server .

RUN npm run build

# Prepare node_modules for docker
RUN npm prune --production
RUN apk update && \
    apk add curl && \
    curl -sf https://gobinaries.com/tj/node-prune | sh

# The mv is a workaround for this - https://github.com/tj/node-prune/issues/63
RUN mv node_modules/googleapis/build/src/apis/docs ./docs && \
    node-prune --exclude "**/googleapis/**/docs/*.js" && \
    mv ./docs node_modules/googleapis/build/src/apis/docs


### Build final image
FROM node:24-alpine
USER root

ENV RUNNING_IN_DOCKER="true"
WORKDIR /app/server

# Install Chromium
RUN apk update && \
    apk add --no-cache nss udev ttf-freefont chromium nginx curl && \
    rm -rf /var/cache/apk/* /tmp/*

COPY ./assets/nginx.conf /etc/nginx/nginx.conf
COPY ./assets/entrypoint.sh .
COPY ./assets/healthcheck.sh .
RUN chmod 755 entrypoint.sh healthcheck.sh

COPY --from=web-build /app/web/dist /var/www/html
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/build ./build

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ./healthcheck.sh

ENTRYPOINT ["/bin/sh", "-c", "/var/www/html/vite-envs.sh && ./entrypoint.sh"]
