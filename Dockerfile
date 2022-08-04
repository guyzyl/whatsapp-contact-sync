### Build web files
FROM node:18 AS web-build

WORKDIR /app/web

COPY ["web/package.json", "web/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./web .

RUN npm run build


### Build server files
FROM node:18 AS server-build

WORKDIR /app/server

COPY ["server/package.json", "server/package-lock.json*", "./"]

RUN npm install

COPY ./interfaces /app/interfaces
COPY ./server .

RUN npm run build


### Build final image
FROM node:18-alpine
USER root

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
WORKDIR /app/server

# Install Chromium
RUN apk update \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache nss udev ttf-freefont chromium nginx && \
    rm -rf /var/cache/apk/* /tmp/*

RUN npm install -g pm2 --production
COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN npm install --production

COPY ./assets/nginx.conf /etc/nginx/nginx.conf
COPY ./assets/entrypoint.sh .
RUN chmod 755 entrypoint.sh

COPY --from=web-build /app/web/dist /var/www/html
COPY --from=server-build /app/server/build ./build

ENTRYPOINT ["./entrypoint.sh"]
