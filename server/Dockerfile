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

# Install Chromium.
RUN apk update \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache nss udev ttf-freefont chromium nginx && \
    rm -rf /var/cache/apk/* /tmp/*

RUN npm install -g pm2 --production
COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN npm install --production

COPY --from=server-build /app/server/build ./build

CMD [ "npm", "run", "prod" ]
