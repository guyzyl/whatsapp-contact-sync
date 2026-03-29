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

COPY interfaces ../interfaces
COPY server .

RUN npm run build \
    && npm prune --production

# Prepare node_modules for docker
# The mv is a workaround for this - https://github.com/tj/node-prune/issues/63 \
RUN apk add --no-cache curl \
    && curl -sf https://gobinaries.com/tj/node-prune | sh \
    && mv node_modules/googleapis/build/src/apis/docs ./docs \
    && node-prune --exclude "**/googleapis/**/docs/*.js" \
    && mv ./docs node_modules/googleapis/build/src/apis/docs


### Build final image
FROM node:24-alpine

ARG SERVER_GOOGLE_CLIENT_ID=""
ARG SERVER_GOOGLE_CLIENT_SECRET=""

ENV RUNNING_IN_DOCKER="true" \
    NODE_ENV="production" \
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

COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/build ./build

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "build/server/main.js"]
