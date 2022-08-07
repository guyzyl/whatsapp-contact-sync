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

ENV RUNNING_IN_DOCKER="true"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
WORKDIR /app/server

# Install Chromium
RUN apk update && \
    apk add --no-cache nss udev ttf-freefont chromium nginx && \
    rm -rf /var/cache/apk/* /tmp/*

COPY ["server/package.json", "server/package-lock.json*", "./"]
RUN npm install --production && npm install -g pm2 --production

COPY --from=server-build /app/server/build ./build

EXPOSE 8080

CMD [ "npm", "run", "prod" ]
