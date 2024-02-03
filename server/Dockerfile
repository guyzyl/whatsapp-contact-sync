### Build server files
FROM node:21-alpine AS server-build

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
FROM node:21-alpine
USER root

ENV RUNNING_IN_DOCKER="true"
WORKDIR /app/server

# Install Chromium
RUN apk update && \
    apk add --no-cache nss udev ttf-freefont chromium nginx && \
    rm -rf /var/cache/apk/* /tmp/*

COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/build ./build

EXPOSE 8080

CMD [ "build/server/main.js" ]
